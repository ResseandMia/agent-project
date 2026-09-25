# AI 自动生成视频/动画/剪辑：工具、插件与 Skill 调研 (2026-09)

> 调研日期：2026-09-25。表中数据都经过二次核实。标“（未能核实）”的信息没能确认。star 数是 GitHub 上的约数。

---

## 1. 一句话结论

可以做，而且不用任何付费账号。用代码写动画（Remotion），加上离线中文配音（Kokoro）、代码作曲（FluidSynth），最后用 FFmpeg 混音，就能从一段文案直接做出带配音、配乐和音效的 MP4。生成式 AI 视频（Veo、可灵、即梦等）适合补几秒“实拍感”画面。像本条这种以文字和数据为主的内容，用代码做动画更准确，也更便宜。

---

## 2. 四类工具总览

### 2.1 代码驱动的视频框架（agent 写代码，渲染出 MP4）

| 工具 | 是什么 | 开源/价格 | 能否离线 | 适合做什么 |
|---|---|---|---|---|
| [Remotion](https://github.com/remotion-dev/remotion)（本次采用） | 用 React/TypeScript 写视频，每一帧由代码算出，经无头 Chrome 和 FFmpeg 渲染。约 60.3k star | 源码公开，但不是 MIT/OSI 开源许可。个人和 3 人及以下的公司免费；4 人及以上需要公司授权，$25/席/月起 | 是（装好 npm 包和 Chrome 后） | 动态图形、数字滚动、图表、字幕、批量模板视频 |
| [HyperFrames](https://github.com/heygen-com/hyperframes)（HeyGen） | 写 HTML/CSS/GSAP，在无头 Chrome 里逐帧截图，再用 FFmpeg 出片。自带 CLI、21 个 agent skill 和音频引擎（TTS、配乐、音效、字幕）。约 52.9k star | Apache-2.0，免费，没有商用门槛。HeyGen 音色和素材库要登录；ElevenLabs/Gemini TTS 要自己的 key | 渲染在本地。TTS 和字幕模型首次使用要下载；HeyGen 音色和素材库要联网 | 给 agent 用的解说视频、动态图形。团队规模超过 Remotion 免费门槛时，可作为不用买授权的替代 |
| [Manim CE](https://github.com/ManimCommunity/manim) | Python 动画引擎，适合精确的讲解动画（文字、图形、图表、数字、公式）。v0.21.0，约 41k star | MIT，免费 | 是 | 数据动画，比如“ROAS 2.2 → 5.3”、柱状图。配合 [manim-voiceover](https://github.com/ManimCommunity/manim-voiceover) 可以让画面和配音同步 |
| [FFmpeg](https://github.com/FFmpeg/FFmpeg)（本次采用） | 音视频编码、合成、滤镜的行业标准：转场、混音、BGM 自动避让人声、响度统一、烧录字幕。最新稳定版 8.1 | 免费。主体是 LGPL-2.1+，libx264 等可选组件是 GPL | 是 | 最终混音和编码，把各环节串起来的“胶水”工具 |
| [MoviePy](https://github.com/Zulko/moviepy) | Python 剪辑库，能裁剪、拼接、叠文字、混音。v2.2.1，v2 与 v1 的写法不兼容 | MIT，免费 | 是 | 用 Python 拼时间线、做简单剪辑；不擅长精致动效 |
| GSAP + 无头浏览器录帧（[timecut](https://github.com/tungs/timecut) / Playwright） | 自己写 HTML 动画页，在无头 Chrome 里逐帧截图，再用 FFmpeg 合成 | GSAP 3.15 全部插件免费（免费专有许可，不是 OSI 开源）。timecut 用 BSD-3，2022 年后停更。Playwright 用 Apache-2.0 | 是（装好后） | 不想引入框架时的兜底方案 |
| [Revideo](https://github.com/midrender/revideo) / [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | TypeScript 代码动画库。Revideo 从 Motion Canvas 分出来，提供无头渲染 API | 都是 MIT。Revideo 团队的主要精力已转到商业产品；Motion Canvas 2024-12 后没发新版 | 是。Motion Canvas 要在编辑器里点渲染 | 程序化动画；活跃度和 agent 支持都不如 Remotion/HyperFrames |
| [editly](https://github.com/mifi/editly) / [FFCreator](https://github.com/tnfe/FFCreator) | 用 JSON 描述片段、转场和音频，直接出片的 Node 工具。FFCreator 有中文文档 | 都是 MIT。editly 的 npm 版停在 2022 年，在新版 Node 上常常编译失败 | 是 | 幻灯片式短视频、图文轮播 |
| [Lottie](https://github.com/airbnb/lottie-web) / Rive | 矢量动画播放器，本身不能导出 MP4 | 播放器是 MIT；Rive 编辑器和 LottieFiles 是免费增值服务 | 播放在本地，素材要另找 | 做成动效图标，嵌进 Remotion 或 HyperFrames |
| [Creatomate](https://creatomate.com/docs/api/render-script/json-structure) | 云端渲染 API：JSON 或模板生成 MP4，有官方远程 MCP | 商业服务，第三方列出的价格约 $41–54/月起（未能核实） | 否 | 模板化批量出片（只换文字和图片） |
| [Shotstack](https://shotstack.io/docs/guide/agents/) | 云端 JSON 时间线视频 API，有 agent 文档，提供远程和本地两种 MCP | 按量约 $0.40/渲染分钟（最低充 $10）；订阅约 $0.20/分钟，$39/月起；测试环境出片带水印 | 否 | 接入自动化流程批量出片 |
| [JSON2Video](https://json2video.com/) | 云端 API：JSON（场景、元素、配音、字幕）生成 MP4，主要给 Make/n8n/Zapier 用，有官方 MCP | 免费版有 600 积分（一次性、带水印、单条不超过 1 分钟）。付费约 $16.95/月（年付）起；月付价格（未能核实） | 否 | n8n/Zapier 自动化出片 |

### 2.2 Agent Skill / 插件 / MCP（让 Claude 等 agent 会做视频）

| 工具 | 是什么 | 开源/价格 | 能否离线 | 适合做什么 |
|---|---|---|---|---|
| [Remotion Agent Skills](https://github.com/remotion-dev/skills) + Claude Code 插件 | 官方 skill（README 列出 12 个，包括最佳实践、渲染、字幕等），教 agent 写 Remotion 代码并渲染。安装命令：`npx skills add remotion-dev/skills` | skill 免费，但产出仍受 Remotion 授权约束 | 渲染在本地 | Claude Code 写代码、本地出 MP4，最成熟的路线 |
| [HyperFrames skills](https://github.com/heygen-com/hyperframes) | 21 个 skill，包括 /faceless-explainer（无真人出镜的解说视频）、/motion-graphics 等。支持 Claude Code、Codex、Cursor、Gemini CLI | Apache-2.0，免费 | 渲染在本地；模型首次使用要下载 | 中文解说视频：自带 Kokoro 中文音色、本地字幕转写（Parakeet / whisper.cpp）和 `bgm` 配乐命令 |
| [OpenMontage](https://github.com/calesthio/OpenMontage) | “agent 视频制作系统”：12 条流水线（含动画解说），100 多个工具，700 多个 skill/知识文件，调度 Remotion、HyperFrames 和 FFmpeg。约 61.2k star | AGPL-3.0。用 Remotion 引擎时同样受 Remotion 授权约束；云服务另外收费 | 部分（免费路线是 Piper TTS 加本地渲染） | 从脚本到成片全流程；比较重 |
| [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | 基于 Remotion 的 Claude Code 视频工作区，已接好配音（ElevenLabs、Qwen3-TTS）、配乐（ACE-Step）、生图（FLUX.2）、AI 视频（LTX-2.3）和录屏 | MIT。云端或 GPU 服务按量计费 | 部分（渲染在本地） | 现成的“Remotion + 配音 + 配乐”流水线 |
| [video-use](https://github.com/browser-use/video-use) | Claude Code skill，把实拍素材剪成成片：去口头禅、调色、淡入淡出、烧字幕、叠动效。约 26.9k star | MIT，需要 ElevenLabs API key | 否 | 剪口播和实拍素材 |
| [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 输入文案，自动配 Edge-TTS 中文语音、字幕、BGM 和素材库画面，输出 9:16 或 16:9 短视频。自带 SKILL.md，约 125.6k star | MIT | 否（配音和素材要联网） | 中文短视频批量生产 |
| [Remotion Superpowers](https://github.com/DojoCodingLabs/remotion-superpowers) | 第三方 Claude Code 插件，有 13 个命令（/add-voiceover、/add-music、/add-captions 等），内置 5 个 MCP | MIT。必须有 KIE 付费 key 和 TwelveLabs key | 素材要联网，渲染在本地 | 一条命令加配音、配乐、字幕 |
| [ElevenLabs MCP](https://github.com/elevenlabs/elevenlabs-mcp) | 本地版已于 2026-08-20 归档，现在用官方托管的 MCP。可以生成语音、转写、配音、音乐、音效、图片和视频 | 按积分计费，旧 README 写有每月 1 万积分的免费额度 | 否 | 高质量配音、音乐、音效素材（不负责拼成片） |
| [MiniMax-MCP](https://github.com/MiniMax-AI/MiniMax-MCP) | 官方 MCP：TTS、音色克隆、音色设计、视频生成、文生图 | 服务端 MIT，API 付费 | 否 | 中文配音强。国内和海外是两个地址，key 要和地址对应 |
| HeyGen / Runway 官方 MCP（[HeyGen](https://developers.heygen.com/mcp/claude-code)、[Runway](https://github.com/runwayml/runway-api-mcp-server)） | HeyGen：数字人、视频翻译（175 种以上语言）。Runway 托管 MCP（2026-05-27 上线）：用一个入口调用 Gen-4.5、Seedance、可灵、Veo | 各按自家积分或套餐计费 | 否 | 加数字人主播，或加 AI 生成的 B-roll |
| 剪映/CapCut 草稿自动化：[capcut-mate](https://github.com/Hommy-master/capcut-mate)、[pyJianYingDraft](https://github.com/GuanYixuan/pyJianYingDraft)、VectCutAPI | 用代码生成剪映草稿（视频、音频、文字、特效），再在剪映里打开精修 | 都是 Apache-2.0，免费；VectCutAPI 的云渲染模块没开源 | 草稿在本地生成；导出要剪映客户端 | 让团队在剪映里手动微调 |
| [DaVinci Resolve MCP](https://github.com/samuelgursky/davinci-resolve-mcp) | 让 agent 操作达芬奇：媒体池、时间线、调色、Fusion、Fairlight、渲染队列 | MIT。Resolve 免费版和 Studio 都能用 | 在本地运行，但必须开着达芬奇桌面端 | 已经在用达芬奇的团队做自动化精剪 |

另外还有：[Manim MCP](https://github.com/abhiemj/manim-mcp-server) 和 manim-skill（公式、图表动画）；[Kinocut](https://github.com/KyaniteLabs/kinocut)（Apache-2.0，带预检的 FFmpeg 剪辑 MCP）；[video-audio-mcp](https://github.com/misbahsy/video-audio-mcp)（FFmpeg 的 MCP 包装）；[VEED OpenEdit](https://github.com/veedstudio/open-edit)（流水线是 Apache-2.0，渲染器闭源但免费）；[Editframe](https://editframe.com)（许可证未能核实）。

### 2.3 生成式 AI 视频服务（文字或图片直接生成画面）

| 工具 | 是什么 | 开源/价格 | 能否离线 | 适合做什么 |
|---|---|---|---|---|
| [Google Veo 3.1](https://ai.google.dev/gemini-api/docs/video) | 文字或图片生成视频，自带声音。单段约 8 秒，可以接续到约 148 秒 | 按秒计费，含音频。Lite：$0.05–0.08/秒。Fast：$0.10–0.30/秒。Standard：$0.40–0.60/秒。画面带 SynthID 水印 | 否 | 高质感短 B-roll；中国大陆不能直连 |
| Gemini Omni 1.1 Flash | Google 新视频模型，2026-08-27 正式上线。3–10 秒，带声音，可以用对话方式修改上传的视频 | 约 $0.03/秒（360p）到 $0.30/秒（4K），没有免费额度 | 否 | 便宜的短片段、修改现有视频 |
| [可灵 Kling 3.0 / Avatar 2.0](https://klingai.com/dev) | 快手出品。多镜头，最长 15 秒，自带音频。Avatar 2.0 用一张图加一段音频生成最长 5 分钟的说话数字人 | API 预付费，约 $0.14/单位，5000 单位 $700，小包约 $9.8 起；支持人民币 | 否 | 国内付款方便；数字人口播、B-roll |
| [即梦 Seedance 2.0/2.5 + OmniHuman 1.5](https://www.volcengine.com/article/42387)（字节/火山方舟） | Seedance 2.5 于 2026-07-31 上线，单镜头最长 30 秒，带声音。OmniHuman 用单张图生成对口型数字人，每次最多 35 秒音频 | Seedance 2.0 每百万 tokens ¥46（720p 约 ¥1/秒）；2.5 每百万 tokens ¥70；OmniHuman $0.16/秒 | 否 | 国内团队首选（人民币付款、能开发票）；5–30 秒 B-roll |
| [通义万相 Wan](https://github.com/Wan-Video/Wan2.2)（阿里） | Wan 2.2 开放权重。Wan 3.0 只有 API：30 秒、1080p、带声音，能直接用 doc/xls/ppt/pdf 生成视频 | Wan 2.2 用 Apache-2.0。Wan 3.0 按分辨率 $0.05、$0.10、$0.20 每秒（480p/720p/1080p） | Wan 2.2 能本地跑（要 24GB 以上显存）；3.0 不能 | 用 PPT 或文档直接生成讲解视频 |
| MiniMax H3（海螺 3.0）/ [Hailuo 2.3](https://www.minimax.io/news/minimax-hailuo-23) | H3 于 2026-07-31 发布：33B 参数，4–15 秒，2K，立体声，取代 Hailuo 2.3 | API 付费（2.3 Fast 约 $0.19 生成 6 秒 768p）。H3 权重已开放，但许可证排除美国、欧盟、英国、韩国 | 否 | 已经在用 MiniMax 配音的团队可以顺手接入 |
| Vidu Q3（生数科技） | 最长 16 秒，1080p，自带音频，支持用参考图生成视频 | API 约 $0.034–0.07/秒 | 否 | 另一家国产 B-roll 选择 |
| [Runway Gen-4.5](https://docs.dev.runwayml.com/) | 旗舰模型，加上 Aleph（用视频改视频）和 Act-Two。托管 MCP 还能调 Seedance、可灵、Veo | API 积分 $0.01/个（最低充 $10）；Gen-4.5 $0.12/秒 | 否 | Claude 同时调多家模型最省事的入口；只支持海外付款 |
| Luma Ray3.2 | 2026-06-09 发布，每段可设最多 16 个关键帧，支持动作迁移，有 API | 商业 API，数据里没有价格 | 否 | Runway 之外的海外选择 |
| [HeyGen API](https://developers.heygen.com/mcp/claude-code) | 数字人或真人分身口播视频，有官方 MCP | 预付费，$5 起，没有免费 API 额度。Avatar IV/V：1080p 约 $3/分钟，4K 约 $4/分钟 | 否 | 画中画数字人主播，能讲完一整段中文 |
| [fal.ai](https://fal.ai) / Replicate | 一个 key 能调 1000 多个模型（Veo、可灵、Seedance、Wan、OmniHuman 等），都有 MCP | 按模型计费。例：Veo 3.1 Standard 带音频 $0.40/秒；Kling 3 Pro 约 $0.22–0.28/秒 | 否 | 想换 B-roll 模型时只改一个模型 ID |
| 开源本地模型：[LTX-2.5](https://github.com/Lightricks/LTX-2)、[HunyuanVideo 1.5](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5)、[InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk) | LTX-2.5：22B 参数，画面和声音一起生成，最高 4K。HunyuanVideo：约 5 秒，没有声音。InfiniteTalk：不限时长的对口型数字人 | LTX 对年收入 $1000 万以下的公司免费。Hunyuan 用社区许可（排除欧盟、英国、韩国）。InfiniteTalk 用 Apache-2.0 | 能离线，但都要大显存 GPU | 有 GPU 工作站时不用付 API 费的方案 |

另外：D-ID、Synthesia 也是老牌数字人平台（Synthesia Creator 套餐 $89/月）。**OpenAI Sora 2 的 API 已于 2026-09-24 停止服务，不要再做相关规划。**

### 2.4 配音 · 配乐 · 音效

| 工具 | 是什么 | 开源/价格 | 能否离线 | 适合做什么 |
|---|---|---|---|---|
| [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) + Kokoro v1.1-zh（本次采用） | 离线语音工具包，加 Kokoro 82M 中文模型：103 个音色（中文女声 55、男声 45），自带数字和日期的中文读法 | 代码和模型都是 Apache-2.0，可以商用 | 是，只用 CPU，实测比实时快约 2.5–3 倍 | 离线中文旁白的首选 |
| [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) | 同一套 Kokoro 音色的另一种封装（约 300MB，量化后约 80MB） | MIT（模型 Apache-2.0） | 是（CPU） | 备用 |
| [MeloTTS](https://github.com/myshell-ai/MeloTTS)（sherpa-onnx 版） | 只有一个中文音色，中英混读不错，44.1kHz | MIT | 是（CPU，速度很快） | 离线备用音色 |
| [edge-tts](https://github.com/rany2/edge-tts) | 调用微软 Edge 的朗读服务，有晓晓、云希等中文音色，能直接输出 SRT 字幕 | 库是 LGPL-3.0。服务免费但不是官方接口，微软答复称商用不在授权范围内 | 否（要联网；本环境被屏蔽） | 个人试听；商用请改用 Azure Speech |
| [CosyVoice 3](https://github.com/FunAudioLLM/CosyVoice)（阿里） | 开源中文 TTS 里质量顶尖：零样本克隆、用指令控制语气、支持 18 种以上方言 | Apache-2.0，可以商用 | 要 GPU | 高质量中文旁白、方言 |
| [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) | 用文字描述来设计音色，3 秒克隆，内置北京话和四川话音色 | Apache-2.0 | 要 GPU | “带货主播”一类风格 |
| [VoxCPM2](https://github.com/OpenBMB/VoxCPM) | 2B 参数，48kHz，30 种语言（含 9 种中文方言），可以设计音色和克隆。约 38k star | Apache-2.0 | GPU（约 8GB 显存）；CPU 能跑但慢 | 高质量中文配音 |
| [IndexTTS 2.5](https://github.com/index-tts/index-tts)（B 站）/ [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | IndexTTS 能控制时长（0.5–2 倍）和情绪。GPT-SoVITS 用 5 秒声音做零样本克隆，或用 1 分钟声音微调 | IndexTTS 商用要联系 B 站。GPT-SoVITS 是 MIT，克隆真人声音必须本人同意 | 本地运行，要 NVIDIA GPU | 按固定时长配音、品牌专属声音 |
| 商业中文 TTS API：[MiniMax Speech 2.8](https://platform.minimax.io/docs/guides/pricing-paygo)、豆包 Seed-TTS 2.0、Azure、ElevenLabs v3、OpenAI | 云端“播音级”语音 | MiniMax：Turbo 约 $60，HD 约 $100，都是每百万字符。Azure HD：每百万字符 $22，每月 50 万字符免费。ElevenLabs v3：每千字符 $0.10。豆包克隆音色约 ¥150/个/年 | 否 | 最自然的中文口播 |
| [FluidSynth](https://github.com/FluidSynth/fluidsynth) + FluidR3_GM 音色库（本次采用） | 用代码写 MIDI 乐谱，再用通用 MIDI 音色库渲染成音频。音效用 SoX 或 FFmpeg 合成 | FluidSynth 是 LGPL-2.1，FluidR3_GM 是 MIT；做出来的音乐是原创 | 是 | 没有版权风险的原创 BGM 和音效；音色有点“demo 感” |
| AI 配乐/音效：[ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5)、Stable Audio 3、Suno、ElevenLabs Music、Lyria | ACE-Step 用文字和歌词生成 10 秒到 10 分钟的音乐。Stable Audio 3 Small 能在 CPU 上生成音效和音乐 | ACE-Step 是 MIT。Stable Audio 对年收入 $100 万以下免费。Suno Pro $10/月，含商用权。ElevenLabs 音乐 $0.15/分钟，音效 $0.12/分钟。Lyria 约 $0.04–0.08/首（未能核实） | 开源款能本地跑（ACE-Step 要 GPU）；商业款要联网 | 定制风格的 BGM |
| 免版税素材库：[Pixabay](https://pixabay.com/service/license-summary/)、Mixkit、Freesound、Uppbeat、BBC 音效 | 人工制作的音乐和音效库 | Pixabay 可以商用，不用署名。Mixkit 免费许可可商用。Freesound 每条授权不同。BBC 只限个人和教育用途 | 否（要手动下载） | 商用广告优先用 Pixabay 或 Mixkit |

---

## 3. 各类的要点与坑

**代码驱动框架**
- 最大的优势是准确：画面上的中文、数字、图表完全可控，改一句文案重新渲染就行。生成式 AI 视频做不到这一点。
- 这类框架都不需要 GPU，普通电脑 CPU 就能渲染。
- **Remotion 不是 MIT 开源许可。** 个人、员工不超过 3 人的公司和非营利组织可以免费用，包括商用。按 v5 条款，同一项目的所有参与者（包括外包）合计达到 4 人及以上，就要买公司授权。
- 有些库已停更或过时：fluent-ffmpeg 已归档，ffmpeg-python 自 2019 年没更新，Motion Canvas 和 editly 也都停在旧版本。遇到这类情况，让 agent 直接写 ffmpeg 命令就行。
- MoviePy：AI 常写出 v1 的旧写法；中文字幕要手动指定中文字体。
- 云端渲染 API（Creatomate、Shotstack、JSON2Video）按次或按分钟计费，要 key，测试环境出片带水印。

**Agent Skill / 插件 / MCP**
- skill 只是“说明书”，能力和授权都来自底层框架。Remotion 的 skill 仍然受 Remotion 授权约束。
- OpenMontage 用 AGPL-3.0：如果拿它做对外服务，修改过的代码必须开源。
- 不少“一键”插件依赖付费服务：Remotion Superpowers 必须有 KIE 付费 key；video-use 必须有 ElevenLabs key。
- 剪映草稿在任何系统上都能生成，但 pyJianYingDraft 的自动导出只支持 Windows 加剪映 6 及以下版本，**剪映 7 以上不支持**。
- ElevenLabs 的本地 MCP 已归档，要用托管版。Remotion 的托管文档 MCP 也已弃用，改用 /remotion-docs skill。
- 达芬奇 MCP 要开着桌面端，在服务器上用不了。

**生成式 AI 视频**
- 不适合直接做整条讲解视频，中文、数字、图表容易出错。建议只让它生成 5–15 秒的 B-roll，文字和数据用代码叠上去。
- 成本举例：Veo 3.1 Standard 1 分钟约 $24；Veo Lite 1080p 1 分钟约 $4.8；Wan 3.0 1080p 1 分钟约 $12。
- 国内付款：可灵、即梦/火山、通义万相支持人民币。Veo 在大陆不能直连，Runway 只支持海外付款。
- 开源模型都要大显存 GPU（Wan 2.2 要 24GB 以上，HunyuanVideo 要 14GB 以上），CPU 跑不了。
- 许可证限制：HunyuanVideo 1.5 和 MiniMax H3 的权重排除欧盟、英国、韩国（H3 还排除美国）；LTX 在年收入达到 $1000 万后要付费。
- 数字人时长：OmniHuman 每次最多 35 秒，要分段拼接；可灵 Avatar 2.0 最长 5 分钟。

**配音 · 配乐 · 音效**
- 中文音质大致从高到低：商业 API（MiniMax、豆包、ElevenLabs、Azure）；开源 GPU 模型（CosyVoice 3、Qwen3-TTS、VoxCPM2、IndexTTS）；只用 CPU 的离线模型（Kokoro、MeloTTS）。
- **edge-tts 不要用在商业广告上**：它不是官方接口，微软答复称商用不在授权范围内。想要微软音色，请用 Azure Speech。
- 有些模型只许非商业使用：F5-TTS 权重、ChatTTS 模型、Spark-TTS 权重（已改为 CC BY-NC-SA）、AudioCraft 和 YuE 权重都是 NC 许可；Fish Speech 用研究许可；IndexTTS 商用要单独联系 B 站。
- 要 GPU 的：CosyVoice、Qwen3-TTS、IndexTTS、ACE-Step。能在 CPU 上跑的：Kokoro、MeloTTS、Stable Audio 3 Small。
- 素材库：Mixkit 标为“受限许可”的条目只能个人用；Freesound 每条授权不同；BBC 音效不能商用；Udio 自 2025-10-30 起不能下载。
- 克隆真人声音，必须先取得本人同意。

---

## 4. 本次实际采用的方案

**环境限制决定了选型。** 本次运行的沙箱能访问 npm、PyPI、apt 和 GitHub Releases，但**访问不了 HuggingFace、ModelScope、微软 Edge TTS 和大多数 SaaS API**。沙箱也**没有 GPU，没有付费 API key**。

**流程：** 文案先拆成句子。每句用 Kokoro 配音，得到这句的时长，再用 SenseVoice 语音识别回听一遍，检查有没有读错。Remotion 按这些时长排好动画和字幕，在无头浏览器里渲染画面，同时把配音、音效和 BGM 混进去（人声出现时 BGM 自动变小）。最后 FFmpeg 统一全片响度，输出 MP4。

| 环节 | 工具 | 为什么选它 |
|---|---|---|
| 动画与合成 | **Remotion**（用 React 写动画，本地 Chromium 无头渲染） | 生态最成熟（约 60k star，有官方 agent skill），能精确控制每一帧，适合“ROAS 2.2 → 5.3”这类数字滚动、漏斗图和时间线。只需要 npm 包和本地 Chromium（浏览器下载被拦时，可以用 `--browser-executable` 指定本机浏览器），完全离线 |
| 中文配音 | **Kokoro v1.1-zh**，经 **sherpa-onnx** 在 CPU 上离线运行 | 模型放在 GitHub Releases 上，这里能下载；Apache-2.0，可以商用；有 100 个中文音色；“600 美元”“5.3”“9 月 1 日”能直接读对；百分号、区间（2–6 小时）、除号和英文缩写（ROAS 读成 R-O-A-S）由脚本预先转写成中文读法；CPU 上比实时快约 2.5–3 倍 |
| 背景音乐 | 用代码写 **MIDI**，经 **FluidSynth + FluidR3_GM** 渲染 | 原创音乐，没有版权风险（音色库是 MIT）。素材网站和 AI 音乐服务在本环境里都用不了 |
| 音效 | 代码合成 | 转场、强调用的提示音，完全离线，也是原创 |
| 混音与编码 | **Remotion + FFmpeg** | Remotion 按帧混音，人声出现时 BGM 自动压低；FFmpeg 把全片响度统一到 -14 LUFS，输出 H.264 MP4 |

**没选的方案：**
- HyperFrames：同样合适，而且商用没有门槛。但它的配音和字幕模型要额外下载，配乐素材库要登录 HeyGen，在本环境里受限。
- edge-tts：本环境访问不了，商用也有风险。
- CosyVoice、Qwen3-TTS 等：要 GPU，模型权重在 HuggingFace 或 ModelScope 上。
- Veo、可灵等生成式视频：没有 key，也访问不了。本条内容以文字和数据为主，代码动画本来就更准确。

> **商用前请注意 Remotion 授权：** 个人和员工不超过 3 人的公司可以免费商用。同一项目的参与者（包括外包）达到 4 人及以上，需要买公司授权：Creators $25/席/月；Automators 每次渲染 $0.01，每月最低 $100；Enterprise 每月最低 $500。请先看 [Remotion 授权说明](https://www.remotion.dev/license) 和 [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)。如果不想付费，可以把动画迁移到 Apache-2.0 的 HyperFrames。

---

## 5. 如果以后想升级

1. **更自然的配音**：把 Kokoro 换成 MiniMax Speech 2.8、火山/豆包 Seed-TTS 2.0 或 ElevenLabs v3。只替换配音这一步，其他流程不变。
2. **AI 生成的实拍感画面（B-roll）**：用 Veo 3.1 Fast、可灵 3.0 或 Seedance 2.5 生成 5–10 秒的片段插进去，文字和数据仍由 Remotion 叠加。
3. **更有质感的配乐**：用 Suno Pro（$10/月，含商用权），或者在 GPU 机器上跑 ACE-Step 1.5（MIT），也可以直接从 Pixabay 选曲。
4. **人工精修**：用 capcut-mate 或 pyJianYingDraft 把分段画面、旁白和 BGM 生成剪映草稿，团队在剪映里调字幕、换素材。
5. **数字人出镜**：用 HeyGen（1080p 约 $3/分钟）或可灵 Avatar 2.0 做画中画口播主播，叠在动画上。