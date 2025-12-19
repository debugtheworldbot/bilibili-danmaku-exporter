import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [danmakuStats, setDanmakuStats] = useState<any>(null);
  
  // ASS conversion options
  const [resolution, setResolution] = useState<"1080p" | "2k" | "4k">("1080p");

  // Resolution mapping
  const resolutionMap = {
    "1080p": { width: 1920, height: 1080 },
    "2k": { width: 2560, height: 1440 },
    "4k": { width: 3840, height: 2160 },
  };

  const { width, height } = resolutionMap[resolution];
  const [fontName, setFontName] = useState("Arial");
  const [fontSize, setFontSize] = useState(25);
  const [alpha, setAlpha] = useState(0.8);
  const [durationMarquee, setDurationMarquee] = useState(5);
  const [durationStill, setDurationStill] = useState(5);
  const [reduceComments, setReduceComments] = useState(true);
  const [danmakuCoverage, setDanmakuCoverage] = useState<"full" | "half" | "quarter">("full");

  const getVideoInfoMutation = trpc.danmaku.getVideoInfo.useMutation({
    onSuccess: (data) => {
      setVideoInfo(data);
      // Auto-detect resolution based on video dimension
      const videoWidth = data.dimension?.width || 1920;
      if (videoWidth >= 3840) {
        setResolution("4k");
      } else if (videoWidth >= 2560) {
        setResolution("2k");
      } else {
        setResolution("1080p");
      }
      toast.success("视频信息获取成功");
    },
    onError: (error) => {
      toast.error(`获取视频信息失败: ${error.message}`);
    },
  });

  const exportDanmakuMutation = trpc.danmaku.exportDanmaku.useMutation({
    onSuccess: (data) => {
      setDanmakuStats(data.stats);
      
      // Download ASS file
      const blob = new Blob([data.assContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoInfo?.title || "danmaku"}.ass`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("弹幕导出成功");
    },
    onError: (error) => {
      toast.error(`导出弹幕失败: ${error.message}`);
    },
  });

  const handleGetVideoInfo = () => {
    if (!videoUrl.trim()) {
      toast.error("请输入视频链接");
      return;
    }
    setVideoInfo(null);
    setDanmakuStats(null);
    getVideoInfoMutation.mutate({ url: videoUrl });
  };

  const handleExportDanmaku = () => {
    if (!videoInfo) {
      toast.error("请先获取视频信息");
      return;
    }
    
    exportDanmakuMutation.mutate({
      cid: videoInfo.cid,
      videoId: videoInfo.bvid,
      videoTitle: videoInfo.title,
      options: {
        width,
        height,
        fontName,
        fontSize,
        alpha,
        durationMarquee,
        durationStill,
        reduceComments,
        danmakuCoverage,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section - Brutalist Typography */}
      <div className="container py-8 md:py-12">
        <div className="space-y-3 text-center">
          <h1 className="font-black text-6xl md:text-8xl leading-none tracking-tighter">
            [弹幕]
          </h1>
          <p className="text-xl md:text-3xl font-bold tracking-tight">
            将 B 站视频弹幕转换为 ASS 字幕文件
          </p>
          <div className="border-t-8 border-black w-24 mx-auto"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container flex-1 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Row 1: Video URL Input and Video Info (side by side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video URL Input */}
            <Card className="border-4 border-black p-6 space-y-4">
              <Label className="text-xl font-black tracking-tight">
                01 / 视频链接
              </Label>
              <div className="flex gap-3">
                <Input
                  placeholder="粘贴 B 站视频链接"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="border-3 border-black text-base h-12 px-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGetVideoInfo();
                    }
                  }}
                />
                <Button
                  onClick={handleGetVideoInfo}
                  disabled={getVideoInfoMutation.isPending}
                  className="h-12 px-6 text-base font-black border-3 border-black"
                  size="lg"
                >
                  {getVideoInfoMutation.isPending ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </Card>

            {/* Video Info Display */}
            {videoInfo && (
              <Card className="border-4 border-black p-6 space-y-4">
                <Label className="text-xl font-black tracking-tight">
                  02 / 视频信息
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="font-black min-w-[70px]">标题:</span>
                    <span className="font-bold line-clamp-1">{videoInfo.title}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-black min-w-[70px]">BV号:</span>
                    <span className="font-mono font-bold">{videoInfo.bvid}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-black min-w-[70px]">时长:</span>
                    <span className="font-bold">
                      {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-black min-w-[70px]">分辨率:</span>
                    <span className="font-bold">
                      {videoInfo.dimension?.width || 1920} × {videoInfo.dimension?.height || 1080}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Row 2: Export Parameters */}
          {videoInfo && (
            <Card className="border-4 border-black p-6 space-y-6">
              <Label className="text-xl font-black tracking-tight">
                03 / 导出参数
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Resolution */}
                <div className="space-y-3">
                  <Label className="text-base font-black">分辨率</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={resolution === "1080p" ? "default" : "outline"}
                      onClick={() => setResolution("1080p")}
                      className="h-14 flex flex-col items-center justify-center text-sm font-black border-2 border-black"
                    >
                      <span>1080p</span>
                      <span className="text-[10px] font-normal">1920×1080</span>
                    </Button>
                    <Button
                      type="button"
                      variant={resolution === "2k" ? "default" : "outline"}
                      onClick={() => setResolution("2k")}
                      className="h-14 flex flex-col items-center justify-center text-sm font-black border-2 border-black"
                    >
                      <span>2K</span>
                      <span className="text-[10px] font-normal">2560×1440</span>
                    </Button>
                    <Button
                      type="button"
                      variant={resolution === "4k" ? "default" : "outline"}
                      onClick={() => setResolution("4k")}
                      className="h-14 flex flex-col items-center justify-center text-sm font-black border-2 border-black"
                    >
                      <span>4K</span>
                      <span className="text-[10px] font-normal">3840×2160</span>
                    </Button>
                  </div>
                </div>

                {/* Font */}
                <div className="space-y-3">
                  <Label className="text-base font-black">字体</Label>
                  <Input
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                    className="border-2 border-black h-10"
                    placeholder="字体名称"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <Label className="text-base font-black">
                    字号: {fontSize}
                  </Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={10}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Alpha */}
                <div className="space-y-3">
                  <Label className="text-base font-black">
                    透明度: {Math.round(alpha * 100)}%
                  </Label>
                  <Slider
                    value={[alpha * 100]}
                    onValueChange={(value) => setAlpha(value[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Duration Marquee */}
                <div className="space-y-3">
                  <Label className="text-base font-black">
                    滚动持续时间: {durationMarquee}秒
                  </Label>
                  <Slider
                    value={[durationMarquee]}
                    onValueChange={(value) => setDurationMarquee(value[0])}
                    min={3}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Duration Still */}
                <div className="space-y-3">
                  <Label className="text-base font-black">
                    固定持续时间: {durationStill}秒
                  </Label>
                  <Slider
                    value={[durationStill]}
                    onValueChange={(value) => setDurationStill(value[0])}
                    min={3}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Coverage Range */}
              <div className="space-y-3">
                <Label className="text-base font-black">弹幕覆盖范围</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    type="button"
                    variant={danmakuCoverage === "full" ? "default" : "outline"}
                    onClick={() => setDanmakuCoverage("full")}
                    className="h-12 text-base font-black border-2 border-black"
                  >
                    全屏
                  </Button>
                  <Button
                    type="button"
                    variant={danmakuCoverage === "half" ? "default" : "outline"}
                    onClick={() => setDanmakuCoverage("half")}
                    className="h-12 text-base font-black border-2 border-black"
                  >
                    1/2 屏幕
                  </Button>
                  <Button
                    type="button"
                    variant={danmakuCoverage === "quarter" ? "default" : "outline"}
                    onClick={() => setDanmakuCoverage("quarter")}
                    className="h-12 text-base font-black border-2 border-black"
                  >
                    1/4 屏幕
                  </Button>
                </div>
              </div>

              {/* Reduce Comments Switch */}
              <div className="flex items-center justify-between border-2 border-black p-4">
                <Label className="text-base font-black cursor-pointer" htmlFor="reduce-comments">
                  防止弹幕重叠
                </Label>
                <Switch
                  id="reduce-comments"
                  checked={reduceComments}
                  onCheckedChange={setReduceComments}
                />
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportDanmaku}
                disabled={exportDanmakuMutation.isPending}
                className="w-full h-16 text-xl font-black border-4 border-black"
                size="lg"
              >
                {exportDanmakuMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" />
                    导出 ASS 文件
                  </>
                )}
              </Button>

              {/* Danmaku Stats */}
              {danmakuStats && (
                <div className="border-2 border-black p-4 space-y-2">
                  <div className="text-base font-black">弹幕统计</div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-black">总数:</span> <span className="font-bold">{danmakuStats.total}</span>
                    </div>
                    <div>
                      <span className="font-black">滚动:</span> <span className="font-bold">{danmakuStats.scroll}</span>
                    </div>
                    <div>
                      <span className="font-black">顶部:</span> <span className="font-bold">{danmakuStats.top}</span>
                    </div>
                    <div>
                      <span className="font-black">底部:</span> <span className="font-bold">{danmakuStats.bottom}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="container py-6 border-t-8 border-black">
        <p className="text-center text-lg font-bold">
          支持 IINA、Infuse、PotPlayer 等本地播放器
        </p>
      </div>
    </div>
  );
}
