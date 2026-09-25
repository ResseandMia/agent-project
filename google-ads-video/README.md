# Google Ads 想扩量，别急着加预算 · 动画解说视频

竖屏 1080×1920 动画解说短视频，由 Claude Code 用代码自动生成：脚本、画面、配音、配乐、音效全部由代码产出，没有用任何付费 API。

- 成片：`out/google-ads-scaling.mp4`
- 工具调研报告：[`docs/video-tools-research.md`](docs/video-tools-research.md)（GitHub 和网络上能帮 AI 生成视频、动画、剪辑的工具、插件和 Skill）
- 场景开发规范：[`docs/SCENE_GUIDE.md`](docs/SCENE_GUIDE.md)

## 制作流程

| 步骤 | 做了什么 | 代码 |
|---|---|---|
| 1. 脚本 | 3 个角度各写一版分镜脚本，3 位评委分别从忠实度、吸引力、可制作性打分，合并成终稿，再逐句对照原文核查事实 | `src/data/script.json` |
| 2. 配音 | Kokoro v1.1-zh 中文语音模型，经 sherpa-onnx 在 CPU 上离线合成。女声（喵老师）用音色 20，男声（阿冲）用音色 59，是在 100 个中文音色里用语音识别准确率和音高起伏筛出来的。数字、百分号、ROAS 等先转成中文读法再合成，合成后用 SenseVoice 语音识别回听，检查有没有读错 | `scripts/build_tts.py` |
| 3. 时间轴 | 每句配音的实际时长决定每个镜头、每条字幕的帧数，角色嘴型跟着配音的音量开合 | `src/data/timeline.json` |
| 4. 画面 | Remotion（React）逐帧渲染：信息图、数字滚动、图表、贴纸风卡片，猫老师和小狗两个 SVG 角色会说话、眨眼 | `src/` |
| 5. 配乐 | 用代码写 MIDI（112 BPM，马林巴、拨弦、钟琴、贝斯、鼓），再用 FluidSynth 和 FluidR3 GM 音色库渲染 | `scripts/compose_music.py` |
| 6. 音效 | whoosh、pop、收银机、错误提示音、唱片刮擦、鼓滚等 20 种音效，全部用代码合成 | `scripts/make_sfx.py` |
| 7. 混音与母带 | Remotion 按帧混音，人声出现时 BGM 自动压低；FFmpeg 把全片响度统一到 -14 LUFS | `scripts/render.sh` |

音乐、音效、配音都是本项目原创生成的，没有版权素材。

## 重新生成

```bash
bash scripts/setup.sh                  # 安装依赖、下载模型和字体（一次性）
python3 scripts/build_tts.py --models ~/.cache/google-ads-video/models   # 配音 + 时间轴
bash scripts/render.sh                 # 配乐、音效、渲染、混音，输出 out/google-ads-scaling.mp4
npx remotion studio                    # 在浏览器里预览、逐帧调整
```

改文案：编辑 `src/data/script.json`，然后重跑上面两步。镜头会自动按新的配音时长重新排版。

## 授权说明

- Remotion 不是 MIT 许可：个人和不超过 3 人的公司可以免费商用，超过的话需要公司授权，见 <https://www.remotion.dev/license>。
- Kokoro 模型和 sherpa-onnx 用 Apache-2.0；FluidR3_GM 音色库用 MIT；字体（站酷庆科黄油体、站酷快乐体、思源黑体、Montserrat）都用 SIL OFL。
