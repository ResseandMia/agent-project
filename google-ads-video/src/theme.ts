export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  ink: "#1B1B1F",
  cream: "#FFF7E8",
  paper: "#FFFFFF",
  muted: "#6B6B76",
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
  blueSoft: "#DCE8FD",
  redSoft: "#FCE0DD",
  yellowSoft: "#FEF1CC",
  greenSoft: "#D9F0DF",
  purple: "#8E6CEF",
  orange: "#FB8C00",
  orangeSoft: "#FFE3C2",
  purpleSoft: "#E6DEFF",
  gold: "#E8A317",
};

export const FONT = {
  display: "ZCOOL QingKe HuangYou",
  fun: "ZCOOL KuaiLe",
  black: "Noto Sans SC Black",
  bold: "Noto Sans SC Bold",
  medium: "Noto Sans SC Medium",
  num: "Montserrat Black",
  numBold: "Montserrat Bold",
};

// Layout zones (vertical 9:16 with platform-UI safe areas)
export const ZONE = {
  chapterY: 120,
  stageTop: 250,
  stageBottom: 1290,
  captionY: 1330,
};

/** chapter theme colors: 第1步 blue, 第2步 orange, 第3步 purple, 第4步 green, 结尾 gold */
export const CHAPTER_COLOR: Record<string, string> = {
  开场: C.red,
  第1步: C.blue,
  第2步: C.orange,
  第3步: C.purple,
  第4步: C.green,
  结尾: C.gold,
};

export const BORDER = 6;
export const SHADOW = `10px 10px 0 ${C.ink}`;
