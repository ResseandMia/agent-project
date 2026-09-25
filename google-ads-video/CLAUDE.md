# google-ads-video：项目说明（给 Claude Code）

中文竖屏动画解说视频项目：Remotion（React）画面 + 离线 Kokoro 中文配音 + 代码作曲和音效。现状、本地运行方法和下一步计划见 `docs/HANDOFF.md`，写场景的规范见 `docs/SCENE_GUIDE.md`。

## 工作方式（用户的额度有限）
- 不要开多 agent 工作流或并行子 agent，除非用户明确要求。一个会话按步骤推进，每步完成后停下来让用户确认：脚本 → 风格样图 → 一个样片场景 → 批量制作 → 一轮审核。
- 看画面时优先看拼图 `out/stills/<id>_sheet.jpg`，只有需要时才看单帧。图片很费 token。
- 只做一轮审核，不做多视角的重复评审。

## 数据流
`src/data/script.json`（台词 + 分镜）→ `scripts/build_tts.py` → `public/audio/vo/*.wav` + `src/data/timeline.json`（帧级时间轴、字幕分段、嘴型音量）→ `src/scenes/<id>.tsx` → `scripts/render.sh` → `out/google-ads-scaling.mp4`

- 台词里写 `{显示|朗读}`，可以让字幕和读音不同，比如 `{Shopify|肖皮飞}`。`ROAS` 会自动读成 R-O-A-S，数字和百分号会自动转成中文读法。
- 改了台词要重跑 `build_tts.py`。只改了关键词或断句，就加 `--only-timeline`，不用重新配音。
- 音乐的断点和重启位置在 `src/data/audio.json`，由 `build_tts.py` 根据开场第 2 句（hook）和 reality 第 1 句的时间自动算出来。

## 写场景的硬性规则
- 场景代码只用相对时间：`useLineStarts()` 的 `at(i)` / `endAt(i)`，`useWordTime()(i, "词")`。不要写死绝对帧号。
- React Hooks（`useSpring`、`useFloat`、`useCurrentFrame` 等）必须写在任何提前 `return null` 之前。之前违反这条导致过整片渲染失败。
- 不要用 `Math.random` 或 `Date`，要随机就用 `remotion` 的 `random('seed')`。
- 画面主体放在 y 250–1290。y 1300 以下是字幕和平台界面区域；y 120–212 是章节进度条（第 1–4 步期间）。
- 不要显示原文里没有的数字或说法（见 `script.json` 的 concept 字段里的【忠实原文】）。
- 角色：欧姐 = 戴眼镜的猫（专家），阿冲 = 绑「冲」字头带的小狗。都用 `src/components/Mascots.tsx`。

## 验证
```bash
npx tsc --noEmit -p .
node scripts/stills.mjs <场景id> auto          # 截图拼图
npx remotion render Main out/test.mp4 --scale=0.25   # 低清全片，检查运行时错误
python3 scripts/audio_qa.py out/<视频>.mp4 --models ~/.cache/google-ads-video/models
```
