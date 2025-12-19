import axios from "axios";

/**
 * Bilibili video ID parser
 * Supports BV, AV numbers, bangumi ep IDs and full URLs
 */
export function parseVideoId(input: string): { type: "bv" | "av" | "ep"; id: string } | null {
  const trimmed = input.trim();

  // BV number pattern
  const bvMatch = trimmed.match(/BV[a-zA-Z0-9]+/i);
  if (bvMatch) {
    return { type: "bv", id: bvMatch[0] };
  }
  // Try to match AV number
  const avMatch = input.match(/av(\d+)/i);
  if (avMatch) {
    return { type: "av", id: avMatch[1] };
  }

  // Try to match bangumi ep ID (support URLs with query parameters)
  const epMatch = input.match(/\/bangumi\/play\/ep(\d+)|\bep(\d+)/i);
  if (epMatch) {
    return { type: "ep", id: epMatch[1] || epMatch[2] };
  }

  return null;
}/**
 * Get bangumi episode info from Bilibili API
 */
export async function getBangumiInfo(epId: string) {
  const response = await axios.get(`https://api.bilibili.com/pgc/view/web/season`, {
    params: { ep_id: epId },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.bilibili.com",
    },
  });

  if (response.data.code !== 0) {
    throw new Error(`Failed to get bangumi info: ${response.data.message}`);
  }

  const episodeData = response.data.result.episodes.find(
    (ep: any) => ep.id.toString() === epId
  );

  if (!episodeData) {
    throw new Error(`Episode ${epId} not found`);
  }

  return {
    cid: episodeData.cid,
    title: episodeData.long_title || episodeData.title,
    bvid: episodeData.bvid,
    duration: episodeData.duration / 1000, // Convert ms to seconds
    dimension: episodeData.dimension || { width: 1920, height: 1080 },
    aid: episodeData.aid,
    pic: episodeData.cover,
    owner: { name: response.data.result.up_info?.name || "Unknown" },
  };
}

/**
 * Get video info from Bilibili API
 */
export async function getVideoInfo(videoId: { type: "bv" | "av" | "ep"; id: string }) {
  // Handle bangumi episodes
  if (videoId.type === "ep") {
    return getBangumiInfo(videoId.id);
  }
  const params: Record<string, string> = {};
  if (videoId.type === "bv") {
    params.bvid = videoId.id;
  } else {
    params.aid = videoId.id;
  }

  const response = await axios.get("https://api.bilibili.com/x/web-interface/view", {
    params,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.bilibili.com",
    },
  });

  if (response.data.code !== 0) {
    throw new Error(`Failed to get video info: ${response.data.message}`);
  }

  const data = response.data.data;
  return {
    bvid: data.bvid,
    aid: data.aid,
    title: data.title,
    duration: data.duration,
    cid: data.cid,
    pic: data.pic,
    owner: data.owner,
    dimension: data.dimension || { width: 1920, height: 1080 },
  };
}

/**
 * Danmaku item from Bilibili protobuf
 */
export interface DanmakuItem {
  time: number; // seconds
  mode: number; // 1-3: scroll, 4: bottom, 5: top
  fontSize: number;
  color: number; // RGB888
  timestamp: number; // unix timestamp ms
  pool: number;
  userId: string;
  rowId: string;
  content: string;
}

/**
 * Get danmaku data from Bilibili API (XML format)
 */
export async function getDanmaku(cid: number): Promise<DanmakuItem[]> {
  const response = await axios.get(`https://comment.bilibili.com/${cid}.xml`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.bilibili.com",
    },
  });

  // Parse XML data from Bilibili
  const xml = response.data;
  const danmakuList: DanmakuItem[] = [];

  // Match <d p="...">content</d> pattern
  const regex = /<d p="([^"]+)">([^<]*)<\/d>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const params = match[1].split(",");
    const content = match[2];

    if (params.length >= 8) {
      danmakuList.push({
        time: parseFloat(params[0]),
        mode: parseInt(params[1]),
        fontSize: parseInt(params[2]),
        color: parseInt(params[3]),
        timestamp: parseInt(params[4]),
        pool: parseInt(params[5]),
        userId: params[6],
        rowId: params[7],
        content: content,
      });
    }
  }

  return danmakuList;
}

/**
 * Convert RGB to BGR for ASS format
 */
function rgbToBgr(rgb: number): string {
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return `&H${b.toString(16).padStart(2, "0").toUpperCase()}${g.toString(16).padStart(2, "0").toUpperCase()}${r.toString(16).padStart(2, "0").toUpperCase()}`;
}

/**
 * ASS conversion options
 */
export interface AssOptions {
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  alpha: number; // 0-1
  durationMarquee: number; // seconds
  durationStill: number; // seconds
  reduceComments: boolean;
  danmakuCoverage: "full" | "half" | "quarter"; // Coverage area for danmaku
}

/**
 * Convert danmaku to ASS subtitle format
 */
export function convertToAss(danmakuList: DanmakuItem[], options: AssOptions): string {
  const {
    width,
    height,
    fontName,
    fontSize,
    alpha,
    durationMarquee,
    durationStill,
    reduceComments,
    danmakuCoverage,
  } = options;

  // Calculate coverage area based on option
  let coverageHeight = height;
  if (danmakuCoverage === "half") {
    coverageHeight = Math.floor(height / 2);
  } else if (danmakuCoverage === "quarter") {
    coverageHeight = Math.floor(height / 4);
  }

  // Calculate alpha value for ASS (0-255, inverted)
  const assAlpha = Math.round((1 - alpha) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

  // ASS file header
  let ass = `[Script Info]
Title: Bilibili Danmaku
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},&H${assAlpha}FFFFFF,&H${assAlpha}FFFFFF,&H${assAlpha}000000,&H${assAlpha}000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Track occupied rows for collision detection
  const scrollRows: { endTime: number; row: number }[] = [];
  const topRows: { endTime: number; row: number }[] = [];
  const bottomRows: { endTime: number; row: number }[] = [];

  // Sort danmaku by time
  const sortedDanmaku = [...danmakuList].sort((a, b) => a.time - b.time);

  // Convert each danmaku to ASS event
  for (const dm of sortedDanmaku) {
    const startTime = formatAssTime(dm.time);
    const color = rgbToBgr(dm.color);

    if (dm.mode >= 1 && dm.mode <= 3) {
      // Scrolling danmaku
      const endTime = formatAssTime(dm.time + durationMarquee);

      // Find available row
      let row = 0;
      if (reduceComments) {
        const now = dm.time;
        const availableRows = scrollRows.filter((r) => r.endTime <= now);
        if (availableRows.length > 0) {
          row = availableRows[0].row;
          scrollRows.splice(scrollRows.indexOf(availableRows[0]), 1);
        } else {
          row = scrollRows.length;
        }
        scrollRows.push({ endTime: now + durationMarquee, row });
      }

      const yPos = Math.min(row * (fontSize + 4) + fontSize, coverageHeight - fontSize);
      const moveTag = `{\\move(${width},${yPos},-${dm.content.length * fontSize},${yPos})}`;
      const colorTag = color !== "&H00FFFFFF" ? `{\\c${color}}` : "";

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${moveTag}${colorTag}${dm.content}\n`;
    } else if (dm.mode === 4) {
      // Bottom danmaku
      const endTime = formatAssTime(dm.time + durationStill);

      let row = 0;
      if (reduceComments) {
        const now = dm.time;
        const availableRows = bottomRows.filter((r) => r.endTime <= now);
        if (availableRows.length > 0) {
          row = availableRows[0].row;
          bottomRows.splice(bottomRows.indexOf(availableRows[0]), 1);
        } else {
          row = bottomRows.length;
        }
        bottomRows.push({ endTime: now + durationStill, row });
      }

      const yPos = height - Math.min((row + 1) * (fontSize + 4), height - coverageHeight);
      const posTag = `{\\an2\\pos(${width / 2},${yPos})}`;
      const colorTag = color !== "&H00FFFFFF" ? `{\\c${color}}` : "";

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${posTag}${colorTag}${dm.content}\n`;
    } else if (dm.mode === 5) {
      // Top danmaku
      const endTime = formatAssTime(dm.time + durationStill);

      let row = 0;
      if (reduceComments) {
        const now = dm.time;
        const availableRows = topRows.filter((r) => r.endTime <= now);
        if (availableRows.length > 0) {
          row = availableRows[0].row;
          topRows.splice(topRows.indexOf(availableRows[0]), 1);
        } else {
          row = topRows.length;
        }
        topRows.push({ endTime: now + durationStill, row });
      }

      const yPos = Math.min((row + 1) * (fontSize + 4), coverageHeight);
      const posTag = `{\\an8\\pos(${width / 2},${yPos})}`;
      const colorTag = color !== "&H00FFFFFF" ? `{\\c${color}}` : "";

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${posTag}${colorTag}${dm.content}\n`;
    }
  }

  return ass;
}

/**
 * Format time for ASS (h:mm:ss.cc)
 */
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);

  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

/**
 * Get danmaku statistics
 */
export function getDanmakuStats(danmakuList: DanmakuItem[]) {
  const total = danmakuList.length;
  const scroll = danmakuList.filter((d) => d.mode >= 1 && d.mode <= 3).length;
  const top = danmakuList.filter((d) => d.mode === 5).length;
  const bottom = danmakuList.filter((d) => d.mode === 4).length;

  return {
    total,
    scroll,
    top,
    bottom,
  };
}
