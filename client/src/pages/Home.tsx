import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download, Video, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [danmakuStats, setDanmakuStats] = useState<any>(null);
  
  // ASS conversion options
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fontName, setFontName] = useState("Arial");
  const [fontSize, setFontSize] = useState(25);
  const [alpha, setAlpha] = useState(0.8);
  const [durationMarquee, setDurationMarquee] = useState(5);
  const [durationStill, setDurationStill] = useState(5);
  const [reduceComments, setReduceComments] = useState(false);

  const getVideoInfoMutation = trpc.danmaku.getVideoInfo.useMutation({
    onSuccess: (data) => {
      setVideoInfo(data);
      setWidth(data.dimension?.width || 1920);
      setHeight(data.dimension?.height || 1080);
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
      },
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Brutalist Typography */}
      <div className="container py-12 md:py-20 space-y-8">
        <div className="space-y-4">
          <h1 className="font-black text-7xl md:text-9xl leading-none tracking-tighter">
            [弹幕]
          </h1>
          <p className="text-2xl md:text-4xl font-bold tracking-tight max-w-3xl">
            将 B 站视频弹幕转换为 ASS 字幕文件
          </p>
          <div className="border-t-8 border-black w-32"></div>
        </div>

        {/* Video URL Input */}
        <Card className="border-4 border-black p-8 md:p-12 space-y-6">
          <div className="space-y-4">
            <Label className="text-2xl font-black tracking-tight">
              01 / 视频链接
            </Label>
            <div className="flex gap-4">
              <Input
                placeholder="粘贴 B 站视频链接 (BV/AV 号或完整 URL)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="border-4 border-black text-lg h-14 px-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGetVideoInfo();
                  }
                }}
              />
              <Button
                onClick={handleGetVideoInfo}
                disabled={getVideoInfoMutation.isPending}
                className="h-14 px-8 text-lg font-black border-4 border-black"
                size="lg"
              >
                {getVideoInfoMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Video className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Video Info Display */}
        {videoInfo && (
          <Card className="border-4 border-black p-8 md:p-12 space-y-6">
            <div className="space-y-4">
              <Label className="text-2xl font-black tracking-tight">
                02 / 视频信息
              </Label>
              <div className="space-y-3 text-lg">
                <div className="flex gap-4">
                  <span className="font-black min-w-[100px]">标题:</span>
                  <span className="font-bold">{videoInfo.title}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-black min-w-[100px]">BV号:</span>
                  <span className="font-mono font-bold">{videoInfo.bvid}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-black min-w-[100px]">时长:</span>
                  <span className="font-bold">
                    {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="font-black min-w-[100px]">分辨率:</span>
                  <span className="font-bold">
                    {videoInfo.dimension?.width || 1920} × {videoInfo.dimension?.height || 1080}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ASS Options */}
        {videoInfo && (
          <Card className="border-4 border-black p-8 md:p-12 space-y-8">
            <Label className="text-2xl font-black tracking-tight">
              03 / 导出参数
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Resolution */}
              <div className="space-y-4">
                <Label className="text-lg font-black">分辨率</Label>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="border-2 border-black"
                    placeholder="宽度"
                  />
                  <span className="text-2xl font-black">×</span>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="border-2 border-black"
                    placeholder="高度"
                  />
                </div>
              </div>

              {/* Font */}
              <div className="space-y-4">
                <Label className="text-lg font-black">字体</Label>
                <Input
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  className="border-2 border-black"
                  placeholder="字体名称"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-4">
                <Label className="text-lg font-black">
                  字号: {fontSize}
                </Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(v[0])}
                  min={10}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Alpha */}
              <div className="space-y-4">
                <Label className="text-lg font-black">
                  透明度: {(alpha * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[alpha * 100]}
                  onValueChange={(v) => setAlpha(v[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Duration Marquee */}
              <div className="space-y-4">
                <Label className="text-lg font-black">
                  滚动持续时间: {durationMarquee}秒
                </Label>
                <Slider
                  value={[durationMarquee]}
                  onValueChange={(v) => setDurationMarquee(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Duration Still */}
              <div className="space-y-4">
                <Label className="text-lg font-black">
                  固定持续时间: {durationStill}秒
                </Label>
                <Slider
                  value={[durationStill]}
                  onValueChange={(v) => setDurationStill(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Reduce Comments */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={reduceComments}
                    onCheckedChange={setReduceComments}
                  />
                  <Label className="text-lg font-black">
                    防止弹幕重叠
                  </Label>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Export Button */}
        {videoInfo && (
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={handleExportDanmaku}
              disabled={exportDanmakuMutation.isPending}
              className="h-20 px-16 text-2xl font-black border-4 border-black"
              size="lg"
            >
              {exportDanmakuMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-4" />
                  转换中...
                </>
              ) : (
                <>
                  <Download className="w-8 h-8 mr-4" />
                  导出 ASS 文件
                </>
              )}
            </Button>
          </div>
        )}

        {/* Statistics */}
        {danmakuStats && (
          <Card className="border-4 border-black p-8 md:p-12 space-y-6">
            <div className="space-y-4">
              <Label className="text-2xl font-black tracking-tight flex items-center gap-4">
                <BarChart3 className="w-8 h-8" />
                弹幕统计
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-5xl font-black">{danmakuStats.total}</div>
                  <div className="text-lg font-bold">总计</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-black">{danmakuStats.scroll}</div>
                  <div className="text-lg font-bold">滚动</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-black">{danmakuStats.top}</div>
                  <div className="text-lg font-bold">顶部</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-black">{danmakuStats.bottom}</div>
                  <div className="text-lg font-bold">底部</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="pt-12 border-t-8 border-black">
          <p className="text-lg font-bold text-muted-foreground">
            支持 IINA、Infuse、PotPlayer 等本地播放器
          </p>
        </div>
      </div>
    </div>
  );
}
