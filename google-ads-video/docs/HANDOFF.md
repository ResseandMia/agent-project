# 交接报告：在本地继续这个项目

> 写于 2026-09-25，云端会话结束前。用本地的 Claude Code 就能接着做：打开 `google-ads-video/` 目录，本地 Claude 会自动读到 `CLAUDE.md` 里的项目说明。

## 1. 现在的状态

| 项目 | 状态 | 位置 |
|---|---|---|
| 成片（1080p，4 分钟，-14 LUFS） | ✅ 完成 | `out/google-ads-scaling.mp4`（66 MB） |
| 手机预览版 | ✅ | `out/google-ads-scaling_720p_preview.mp4`（21 MB） |
| 封面 3:4 / 9:16 | ✅ | `out/cover_3x4.png`、`out/cover_9x16.png` |
| 工具调研报告 | ✅ | `docs/video-tools-research.md` |
| 可复用的制作管线（配音 / 配乐 / 音效 / 字幕 / 角色 / 渲染 / QA） | ✅ | `scripts/`、`src/` |

代码在 GitHub 仓库 `ResseandMia/agent-project` 的分支 **`claude/google-ads-scaling-video-rmufx5`** 上，还没开 PR，也没合并到 master。

## 2. 在本地跑起来

**建议的系统**：macOS 或 Linux。Windows 请用 **WSL2（Ubuntu）**，所有脚本都是在 Ubuntu 24.04 上写、测过的，在 WSL 里基本不用改。

需要：Git、Node 22+、Python 3.11+、ffmpeg、FluidSynth（只有重新生成配乐时才用）、约 2 GB 磁盘。

```bash
git clone https://github.com/ResseandMia/agent-project.git
cd agent-project
git checkout claude/google-ads-scaling-video-rmufx5
cd google-ads-video

bash scripts/setup.sh        # 装依赖；下载配音和语音识别模型（约 530 MB），装到 ~/.cache/google-ads-video/models
npx remotion studio          # 在浏览器里打开预览，拖时间轴逐帧看
```

跟云端的不同：
- **浏览器**：云端用的是预装的 Chromium；本地第一次渲染时，Remotion 会自己下载 Chrome Headless Shell。想用自己的浏览器，可以设 `REMOTION_BROWSER=/路径`。
- **配乐音色库**：Linux 用 apt 装 `fluid-soundfont-gm` 就有。macOS 没有自带的，要自己下载一个 General MIDI `.sf2` 音色库，比如 FluidR3_GM、GeneralUser GS 或 MuseScore_General，然后设 `export SF2_PATH=/路径/xxx.sf2`。只有重新渲染配乐时才需要。
- **音效**：已经在仓库里（`public/sfx/`），渲染时不再重新生成。想重新生成，就加上 `REGEN_SFX=1`。
- **字体**：仓库里的是只含本片用字的精简版（`public/fonts/`）。文案里出现新字时，先跑 `setup.sh` 下载完整字体到 `build/fonts-full/`，再 `cp build/fonts-full/*.ttf public/fonts/`。
- **速度**：本地 CPU 核数越多，渲染越快。4 核大约 10 分钟出一版完整视频。可以用 `REMOTION_CONCURRENCY=8` 提高并发。

常用命令：

```bash
python3 scripts/build_tts.py --models ~/.cache/google-ads-video/models   # 改了台词后：重新配音 + 生成时间轴
python3 scripts/build_tts.py --models x --only-timeline                    # 只改了字幕断句或关键词：不重新配音
node scripts/stills.mjs <场景id> auto      # 渲染某个场景的检查截图 → out/stills/<场景id>_sheet.jpg
npx remotion render Main out/test.mp4 --scale=0.25   # 快速低清全片渲染，用来发现运行时错误
bash scripts/render.sh                     # 正式出片：配乐 → 渲染 → 统一响度 → out/google-ads-scaling.mp4
python3 scripts/audio_qa.py out/google-ads-scaling.mp4 --models ~/.cache/google-ads-video/models   # 检查每句台词在混音后是否听得清
```

## 3. 经验和教训（节选）

**这次的花费分布**：约 4 小时 40 分钟，57 个子 agent，子 agent 约 980 万 token。
- 场景制作加分组审核占 43%。
- 全片 QA 占 37%。
- 工具调研和写脚本各占约 10%。

主要原因是会话开着 ultracode 模式，它的设定就是"不计 token 成本、追求最彻底"。

**值得保留的做法**
- 先摸清环境能访问什么，再选工具。
- 用语音识别代替耳朵：挑音色、查读音、检查混音后是否听得清。
- 以配音时长驱动时间轴：台词一改，画面自动重新排。
- 事实核查要有：这次抓到了一张会误导人的展示份额图。

**教训**
1. 审核过度：第二轮全片 QA 用了 21 个 agent，修的大多是小问题。**以后只做 1 轮审核，只看截图拼图。**
2. 每个场景都手写定制代码，成本随场景数线性增长。**以后先做组件库，多数场景用配置拼。**
3. 视频越长越贵：81 句台词、17 个场景。**先做 60–90 秒的版本。**
4. 问题发现得太晚。**每个场景写完都要做两件事：Hooks 不能写在提前 `return` 之后；跑一次低清全片渲染。**
5. 所有 agent 都用最贵的模型。**审稿、核对这类机械性工作用更便宜的模型。**

## 4. 本地继续时的省钱做法

- **不开 ultracode**，也不开多 agent 工作流。一个会话按步骤来：
  1. 写脚本。
  2. 做一张风格样图，由你确认。
  3. 做一个样片场景，由你确认。
  4. 批量制作。
  5. 做 1 轮审核。
- **每一步做完就停下来让你确认**，避免大批量返工。
- **看截图时只看拼图**（`*_sheet.jpg`），不要一张张看全尺寸图，图片很费 token。
- **想做短版**：在 `src/data/script.json` 里删台词、合并场景，然后重跑 `build_tts.py`。场景代码用的都是相对时间，会自动跟着配音时长走。
- **提前写一个 CLAUDE.md**，把项目约定写清楚，免得每次重新摸索。这次已经写好：`google-ads-video/CLAUDE.md`。

## 5. 下一步可以做什么

1. **抖音精简版（60–90 秒）**：保留开场钩子、4 步各留一个核心画面、总结。改 `script.json` 就行，不用重写组件。
2. **说唱 / 音乐 MV**：
   1. Claude 写歌词。
   2. 你在 Suno 网页上生成歌曲，把音频文件放进 `public/audio/`。
   3. 用节拍检测（librosa）得到节拍点，用语音识别（SenseVoice，已经装好）拿到每个字的时间。
   4. 画面按节拍切镜，歌词逐字弹出，角色嘴型跟人声的音量动。把现在"跟配音走"的时间轴改成"跟节拍走"就行。
3. **更有风格的画面**：先定一份风格设定：参考图、配色、笔触、运动节奏。代码能加的效果包括：手绘抖动线条（SVG turbulence 滤镜）、纸张或丝网印刷纹理、一拍二（12 帧）动画节奏、镜头推拉和视差。也可以用 AI 生图，比如你已有的 NanoBanana 2 skill，做画风统一的角色和背景，再在 Remotion 里做分层动画。
4. **更好的配音**：换成 MiniMax / 火山豆包 / ElevenLabs 的配音接口。只要替换 `scripts/build_tts.py` 里合成的那一步，时间轴和画面都不用改。本地网络不受云端那样的限制，API key 请放在环境变量里，不要写进代码或发在对话里。

## 6. 给本地 Claude Code 的开场提示（可以直接复制）

```
请先读 google-ads-video/CLAUDE.md 和 google-ads-video/docs/HANDOFF.md，了解这个视频项目的现状。
我们要做：<这里写你的目标，比如"60 秒抖音精简版"或"说唱 MV 试验片">。
要求：不要开多 agent 工作流；每完成一步（脚本 → 风格样图 → 一个样片场景 → 批量 → 审核）先停下来给我确认。
```
