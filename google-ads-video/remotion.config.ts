import { Config } from "@remotion/cli/config";
import fs from "node:fs";

// Use a local Chromium if one is configured (the cloud sandbox had Playwright's headless shell);
// otherwise Remotion downloads its own Chrome Headless Shell on first render.
const browser = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(browser)) Config.setBrowserExecutable(browser);
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 4));
