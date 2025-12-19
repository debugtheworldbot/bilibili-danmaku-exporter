# B 站弹幕导出工具 [弹幕]

将 B 站视频弹幕转换为 ASS 字幕文件，支持本地播放器（IINA、Infuse、PotPlayer 等）。

## 功能特性

- ✅ 支持 BV 号、AV 号、完整 URL 和番剧链接
- ✅ 自动获取视频信息（标题、时长、分辨率）
- ✅ 支持滚动、顶部、底部三种弹幕类型
- ✅ 智能轨道分配算法，防止弹幕重叠
- ✅ 自定义弹幕样式（字体、字号、透明度、持续时间）
- ✅ 弹幕覆盖范围选项（全屏、1/2 屏幕、1/4 屏幕）
- ✅ 分辨率预设（1080p、2K、4K）
- ✅ 无需登录即可使用

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**: Express 4 + tRPC 11
- **数据库**: MySQL (Drizzle ORM)
- **部署**: Manus 平台

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

## 使用方法

1. 粘贴 B 站视频链接（支持普通视频和番剧）
2. 点击获取视频信息
3. 调整弹幕参数（分辨率、字体、覆盖范围等）
4. 点击导出弹幕，下载 ASS 文件
5. 将 ASS 文件与视频文件放在同一目录下，使用本地播放器打开

## 支持的链接格式

- BV 号: `BV1xx411c7mD`
- AV 号: `av170001`
- 完整 URL: `https://www.bilibili.com/video/BV1xx411c7mD`
- 番剧链接: `https://www.bilibili.com/bangumi/play/ep331044`

## 弹幕参数说明

- **分辨率**: 选择与视频匹配的分辨率（1080p/2K/4K）
- **字体**: 弹幕显示字体（默认 Arial）
- **字号**: 弹幕文字大小（10-100）
- **透明度**: 弹幕不透明度（0-100%）
- **滚动持续时间**: 滚动弹幕从右到左的时间（秒）
- **静止持续时间**: 顶部/底部弹幕显示时间（秒）
- **覆盖范围**: 弹幕显示区域（全屏/半屏/四分之一屏）

## 设计风格

采用字体排印粗野主义（Typographic Brutalism）美学：

- 超大尺寸、重磅无衬线字体
- 纯黑色文字配纯白背景
- 高对比度非对称布局
- 粗几何线条和大量留白
- 原始、未经修饰的工业氛围

## 许可证

MIT License

## 致谢

- [bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) - B 站 API 文档
- [danmaku2ass](https://github.com/m13253/danmaku2ass) - 弹幕转换参考实现
