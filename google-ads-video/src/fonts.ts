import { continueRender, delayRender, staticFile } from "remotion";
import { FONT } from "./theme";

const FILES: Record<string, string> = {
  [FONT.display]: "fonts/ZCOOLQingKeHuangYou.ttf",
  [FONT.fun]: "fonts/ZCOOLKuaiLe.ttf",
  [FONT.black]: "fonts/NotoSansSC-Black.ttf",
  [FONT.bold]: "fonts/NotoSansSC-Bold.ttf",
  [FONT.medium]: "fonts/NotoSansSC-Medium.ttf",
  [FONT.num]: "fonts/Montserrat-Black.ttf",
  [FONT.numBold]: "fonts/Montserrat-Bold.ttf",
};

let started = false;

export const loadFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("fonts");
  Promise.all(
    Object.entries(FILES).map(([family, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`);
      return face.load().then((f) => {
        document.fonts.add(f);
      });
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error("font load failed", e);
      continueRender(handle);
    });
};
