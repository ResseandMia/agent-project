// Render review stills for one or more scenes and tile them into a contact sheet.
//   node scripts/stills.mjs <sceneId|all> [relFrames comma list | "auto"] [--scale=0.5]
// "auto" picks: scene start+10, every line start+12, and the last frame-6.
// Output: out/stills/<sceneId>/*.png and out/stills/<sceneId>_sheet.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tl = JSON.parse(fs.readFileSync(path.join(root, "src/data/timeline.json"), "utf8"));
const args = process.argv.slice(2);
const target = args[0] ?? "all";
const framesArg = args[1] ?? "auto";
const scale = Number((args.find((a) => a.startsWith("--scale=")) ?? "--scale=0.5").split("=")[1]);

const scenes = target === "all" ? tl.scenes : tl.scenes.filter((s) => target.split(",").includes(s.id));
if (!scenes.length) {
  console.error("no scene", target, "known:", tl.scenes.map((s) => s.id).join(" "));
  process.exit(1);
}

// --isolate (default when a single scene is targeted): bundle only that scene's component so that
// other scene files being edited concurrently cannot break this render.
const isolate = !args.includes("--no-isolate") && target !== "all" && !target.includes(",");
let webpackOverride = (c) => c;
if (isolate) {
  const sceneFile = path.join(root, "src/scenes", `${target}.tsx`);
  const gen = path.join(root, "build", `scenes-only-${target}.ts`);
  fs.mkdirSync(path.dirname(gen), { recursive: true });
  fs.writeFileSync(
    gen,
    (fs.existsSync(sceneFile)
      ? `import Comp from ${JSON.stringify(sceneFile.replace(/\.tsx$/, ""))};\nexport const SCENES: Record<string, any> = { ${JSON.stringify(target)}: Comp };\n`
      : `export const SCENES: Record<string, any> = {};\n`),
  );
  webpackOverride = (c) => ({
    ...c,
    plugins: [
      ...(c.plugins ?? []),
      new (require("webpack").NormalModuleReplacementPlugin)(/^\.\/scenes$/, gen),
    ],
  });
}
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public"), webpackOverride });
const browser = await openBrowser("chrome", {
  browserExecutable: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
});
const comp = await selectComposition({ serveUrl, id: "Main", puppeteerInstance: browser });

for (const s of scenes) {
  let rel;
  if (framesArg === "auto") {
    rel = [10, ...s.lines.map((l) => l.relStart + 12), s.duration - 6];
  } else {
    rel = framesArg.split(",").map(Number);
  }
  rel = [...new Set(rel.filter((f) => f >= 0 && f < s.duration))];
  const dir = path.join(root, "out/stills", s.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const r of rel) {
    const out = path.join(dir, `${String(r).padStart(4, "0")}.png`);
    await renderStill({ composition: comp, serveUrl, frame: s.start + r, output: out, scale, puppeteerInstance: browser });
    files.push(out);
  }
  // contact sheet (max 4 columns) via ffmpeg tile
  const cols = Math.min(4, files.length);
  const rows = Math.ceil(files.length / cols);
  const sheet = path.join(root, "out/stills", `${s.id}_sheet.jpg`);
  const inputs = files.flatMap((f) => ["-i", f]);
  const pads = files.length < cols * rows ? cols * rows - files.length : 0;
  const filter =
    files.map((_, i) => `[${i}:v]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='${s.id} +${rel[i]}':x=10:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";") +
    ";" +
    files.map((_, i) => `[v${i}]`).join("") +
    (pads ? `` : "") +
    `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, () => "w0").join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, () => "h0").join("+")}`).join("|")}:fill=white[out]`;
  if (files.length === 1) {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", files[0], sheet]);
  } else {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]", "-q:v", "3", sheet]);
  }
  console.log(`${s.id}: ${files.length} stills → ${path.relative(root, sheet)}`);
}
await browser.close({ silent: true });
