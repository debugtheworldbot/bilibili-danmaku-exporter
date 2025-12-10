import { describe, expect, it } from "vitest";
import { parseVideoId, convertToAss, getDanmakuStats, type DanmakuItem } from "./bilibili";

describe("Bilibili Video ID Parser", () => {
  it("should parse BV number from string", () => {
    const result = parseVideoId("BV1xx411c7mD");
    expect(result).toEqual({ type: "bv", id: "BV1xx411c7mD" });
  });

  it("should parse BV number from full URL", () => {
    const result = parseVideoId("https://www.bilibili.com/video/BV1xx411c7mD");
    expect(result).toEqual({ type: "bv", id: "BV1xx411c7mD" });
  });

  it("should parse AV number from string", () => {
    const result = parseVideoId("av170001");
    expect(result).toEqual({ type: "av", id: "170001" });
  });

  it("should parse AV number from full URL", () => {
    const result = parseVideoId("https://www.bilibili.com/video/av170001");
    expect(result).toEqual({ type: "av", id: "170001" });
  });

  it("should return null for invalid input", () => {
    const result = parseVideoId("invalid input");
    expect(result).toBeNull();
  });

  it("should handle case-insensitive BV numbers", () => {
    const result = parseVideoId("bv1xx411c7md");
    expect(result).toEqual({ type: "bv", id: "bv1xx411c7md" });
  });
});

describe("Danmaku Statistics", () => {
  it("should calculate correct statistics", () => {
    const danmakuList: DanmakuItem[] = [
      { time: 10, mode: 1, fontSize: 25, color: 0xffffff, timestamp: 0, pool: 0, userId: "1", rowId: "1", content: "滚动1" },
      { time: 20, mode: 2, fontSize: 25, color: 0xffffff, timestamp: 0, pool: 0, userId: "2", rowId: "2", content: "滚动2" },
      { time: 30, mode: 4, fontSize: 25, color: 0xffffff, timestamp: 0, pool: 0, userId: "3", rowId: "3", content: "底部" },
      { time: 40, mode: 5, fontSize: 25, color: 0xffffff, timestamp: 0, pool: 0, userId: "4", rowId: "4", content: "顶部" },
    ];

    const stats = getDanmakuStats(danmakuList);
    expect(stats).toEqual({
      total: 4,
      scroll: 2,
      top: 1,
      bottom: 1,
    });
  });

  it("should handle empty danmaku list", () => {
    const stats = getDanmakuStats([]);
    expect(stats).toEqual({
      total: 0,
      scroll: 0,
      top: 0,
      bottom: 0,
    });
  });
});

describe("ASS Conversion", () => {
  it("should generate valid ASS file header", () => {
    const danmakuList: DanmakuItem[] = [];
    const options = {
      width: 1920,
      height: 1080,
      fontName: "Arial",
      fontSize: 25,
      alpha: 0.8,
      durationMarquee: 5,
      durationStill: 5,
      reduceComments: false,
    };

    const ass = convertToAss(danmakuList, options);

    expect(ass).toContain("[Script Info]");
    expect(ass).toContain("PlayResX: 1920");
    expect(ass).toContain("PlayResY: 1080");
    expect(ass).toContain("[V4+ Styles]");
    expect(ass).toContain("[Events]");
  });

  it("should convert scrolling danmaku correctly", () => {
    const danmakuList: DanmakuItem[] = [
      {
        time: 10.5,
        mode: 1,
        fontSize: 25,
        color: 0xffffff,
        timestamp: 0,
        pool: 0,
        userId: "1",
        rowId: "1",
        content: "测试弹幕",
      },
    ];

    const options = {
      width: 1920,
      height: 1080,
      fontName: "Arial",
      fontSize: 25,
      alpha: 0.8,
      durationMarquee: 5,
      durationStill: 5,
      reduceComments: false,
    };

    const ass = convertToAss(danmakuList, options);

    expect(ass).toContain("Dialogue:");
    expect(ass).toContain("测试弹幕");
    expect(ass).toContain("\\move(");
  });

  it("should convert top danmaku correctly", () => {
    const danmakuList: DanmakuItem[] = [
      {
        time: 10,
        mode: 5,
        fontSize: 25,
        color: 0xff0000,
        timestamp: 0,
        pool: 0,
        userId: "1",
        rowId: "1",
        content: "顶部弹幕",
      },
    ];

    const options = {
      width: 1920,
      height: 1080,
      fontName: "Arial",
      fontSize: 25,
      alpha: 0.8,
      durationMarquee: 5,
      durationStill: 5,
      reduceComments: false,
    };

    const ass = convertToAss(danmakuList, options);

    expect(ass).toContain("顶部弹幕");
    expect(ass).toContain("\\an8");
    expect(ass).toContain("\\pos(");
  });

  it("should convert bottom danmaku correctly", () => {
    const danmakuList: DanmakuItem[] = [
      {
        time: 10,
        mode: 4,
        fontSize: 25,
        color: 0x00ff00,
        timestamp: 0,
        pool: 0,
        userId: "1",
        rowId: "1",
        content: "底部弹幕",
      },
    ];

    const options = {
      width: 1920,
      height: 1080,
      fontName: "Arial",
      fontSize: 25,
      alpha: 0.8,
      durationMarquee: 5,
      durationStill: 5,
      reduceComments: false,
    };

    const ass = convertToAss(danmakuList, options);

    expect(ass).toContain("底部弹幕");
    expect(ass).toContain("\\an2");
    expect(ass).toContain("\\pos(");
  });

  it("should handle custom font settings", () => {
    const danmakuList: DanmakuItem[] = [];
    const options = {
      width: 1920,
      height: 1080,
      fontName: "Microsoft YaHei",
      fontSize: 36,
      alpha: 0.9,
      durationMarquee: 8,
      durationStill: 6,
      reduceComments: true,
    };

    const ass = convertToAss(danmakuList, options);

    expect(ass).toContain("Microsoft YaHei");
    expect(ass).toContain(",36,"); // Font size in Style line
  });
});
