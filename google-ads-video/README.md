# Google Ads 想扩量，别急着加预算 · 动画解说视频

竖屏 1080×1920、30fps、约 4 分钟的双人动画解说短视频。脚本、画面、配音、配乐、音效全部由 Claude Code 用代码生成，没有用任何付费 API 或版权素材。

- 成片：`out/google-ads-scaling.mp4`（1080p，H.264 + AAC，响度 -14 LUFS，可直接上传抖音、视频号、小红书、YouTube Shorts）；手机预览用 `out/google-ads-scaling_720p_preview.mp4`（21 MB）
- 封面：`out/cover_3x4.png`（小红书 3:4）、`out/cover_9x16.png`（竖屏 9:16）
- 工具调研报告：[`docs/video-tools-research.md`](docs/video-tools-research.md)，整理了 GitHub 和网络上能帮 AI 生成视频、动画、剪辑的工具、插件和 Skill
- 场景开发规范：[`docs/SCENE_GUIDE.md`](docs/SCENE_GUIDE.md)
- **在本地继续制作**：[`docs/HANDOFF.md`](docs/HANDOFF.md)（现状、本地运行步骤、经验教训、下一步计划），给 Claude Code 的项目说明在 [`CLAUDE.md`](CLAUDE.md)

## 角色和结构

- **欧姐**（戴圆眼镜的猫，女声）：冷静的 Google Ads 投放排查师，所有数字、规则和结论都由她讲。
- **阿冲**（绑「冲」字头带的小狗，男声）：冲动型卖家，替观众提问、犯错、制造笑点。
- 贯穿道具：一个红色「加预算」大按钮。开场被玻璃罩扣住，每排查完一步，按钮的状态就跟着变。

开场钩子 → 瓶颈 → 第 1 步（时间滞后 ROAS）→ 第 2 步（花不出去：广告评级）→ 第 3 步（ROAS 目标太高、优化 Feed）→ 第 4 步（横向扩量、耐心评估）→ 对照自己后台 → 一句话总结 → 收藏关注 → 片尾总结卡。

## 制作流程

| 步骤 | 做了什么 | 代码 |
|---|---|---|
| 1. 脚本 | 从 3 个角度各写一版分镜脚本（双人小剧场 / 信息图 / 留存导向），3 位评委分别从忠实原文、吸引力、可制作性打分，合并成终稿，再逐句对照原文核查事实 | `src/data/script.json` |
| 2. 配音 | Kokoro v1.1-zh 中文语音模型，经 sherpa-onnx 在 CPU 上离线合成。欧姐用音色 20，阿冲用音色 59，是在 100 个中文音色里按语音识别准确率和音高起伏挑出来的。数字、百分号、ROAS（读作 R-O-A-S）、Shopify 等先转成好读的中文写法再合成，合成后用 SenseVoice 语音识别回听，检查有没有读错 | `scripts/build_tts.py` |
| 3. 时间轴 | 每句配音的实际时长决定每个镜头和每条字幕的帧数。字幕在词语边界处换行，角色嘴型跟着配音的音量开合 | `src/data/timeline.json` |
| 4. 画面 | 用 Remotion（React）逐帧渲染：信息图、数字滚动、图表、贴纸风卡片，两个 SVG 角色会说话、眨眼、做表情。17 个场景分 6 组并行制作，每组由独立的审稿 agent 看截图打分、提修改意见，修完再复查 | `src/scenes/`、`src/components/` |
| 5. 全片 QA | 4 位审稿人分别从风格统一、版式与可读性、忠实原文与音画同步、观众体验四个角度检查全片，修复后再独立复核；另外用 React Hooks 规则检查代码 | — |
| 6. 配乐 | 用代码写 MIDI（112 BPM，马林巴、拨弦、钟琴、贝斯、鼓），再用 FluidSynth 和 FluidR3 GM 音色库渲染。开场「停！」处音乐骤停，最后一个和弦落在片尾卡出现的那一刻 | `scripts/compose_music.py` |
| 7. 音效 | whoosh、pop、收银机、错误提示音、唱片刮擦、鼓点等 21 种音效，全部用代码合成；有人说话时音效自动压低 | `scripts/make_sfx.py` |
| 8. 混音与母带 | Remotion 按帧混音，人声出现时 BGM 自动压低；FFmpeg 把全片响度统一到 -14 LUFS（峰值 -1 dBTP），再压缩成适合上传的文件；最后用语音识别检查混音后每句台词是否仍然清楚 | `scripts/render.sh`、`scripts/audio_qa.py` |

## 重新生成

```bash
bash scripts/setup.sh                   # 安装依赖、下载模型和字体（一次性）
cp build/fonts-full/*.ttf public/fonts/ # 改了文案时用完整字体，仓库里的是精简过的字体子集
python3 scripts/build_tts.py --models ~/.cache/google-ads-video/models   # 配音 + 时间轴
bash scripts/render.sh                  # 音效、配乐、渲染、混音 → out/google-ads-scaling.mp4
npx remotion studio                     # 在浏览器里预览、逐帧调整
node scripts/stills.mjs <场景id> auto   # 给某个场景渲染检查用的截图
```

改文案：编辑 `src/data/script.json` 里的台词，然后重跑上面的配音和渲染两步。镜头会按新的配音时长自动重新排。台词里可以写 `{显示文字|朗读文字}`，让字幕和读音不同，比如 `{Shopify|肖皮飞}`。

## 授权说明

- Remotion 不是 MIT 许可：个人和不超过 3 人的公司可以免费商用，超过的话需要购买公司授权，详见 <https://www.remotion.dev/license>。
- Kokoro 模型和 sherpa-onnx 用 Apache-2.0；FluidR3_GM 音色库用 MIT；字体（站酷庆科黄油体、站酷快乐体、思源黑体、Montserrat）都用 SIL OFL。
- 视频里的音乐、音效和配音都是本项目生成的原创内容。
