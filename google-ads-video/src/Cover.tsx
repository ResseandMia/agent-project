import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "./components/Background";
import { BudgetButton } from "./components/BudgetButton";
import { Emoji, Marker } from "./components/kit";
import { MascotFace } from "./components/Mascots";
import { Tag } from "./components/Shared";
import { loadFonts } from "./fonts";
import { BORDER, C, FONT, SHADOW } from "./theme";

loadFonts();

/** Static cover image (封面). Rendered for both 3:4 (小红书) and 9:16. */
export const Cover: React.FC<{ tall?: boolean }> = ({ tall }) => {
  const top = tall ? 260 : 90;
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
        <Tag color={C.ink} text={C.paper} size={40} style={{ transform: "rotate(-3deg)" }}>
          Google Ads 扩量排查 · 4 步
        </Tag>
        <div style={{ fontFamily: FONT.display, fontSize: 150, color: C.ink, lineHeight: 1.05, textAlign: "center", marginTop: 36 }}>
          想扩量？
          <br />
          <span style={{ color: C.red }}>
            <Marker at={-100}>别急着</Marker>
          </span>
          加预算
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: FONT.black,
            fontSize: 46,
            color: C.ink,
            background: C.paper,
            border: `${BORDER}px solid ${C.ink}`,
            borderRadius: 26,
            boxShadow: SHADOW,
            padding: "10px 30px",
          }}
        >
          先找瓶颈，再决定加不加钱
        </div>
        <div style={{ position: "relative", width: 1000, height: tall ? 900 : 700, marginTop: 20 }}>
          <div style={{ position: "absolute", left: 250, top: tall ? 180 : 90 }}>
            <BudgetButton size={500} cover={1} />
          </div>
          <div style={{ position: "absolute", left: 20, top: tall ? 380 : 300 }}>
            <MascotFace kind="cat" size={300} mood="raise" glint={0.5} />
          </div>
          <div style={{ position: "absolute", right: 10, top: tall ? 330 : 250, transform: "rotate(8deg)" }}>
            <MascotFace kind="dog" size={300} mood="money" />
          </div>
          <div
            style={{
              position: "absolute",
              left: 600,
              top: tall ? 100 : 20,
              width: 150,
              height: 150,
              transform: "rotate(12deg)",
              clipPath: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)",
              background: C.ink,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 7,
                clipPath: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)",
                background: C.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.display,
                fontSize: 86,
                color: C.paper,
              }}
            >
              停
            </div>
          </div>
          <Emoji e="💸" size={96} style={{ position: "absolute", left: 150, top: tall ? 150 : 70, transform: "rotate(-12deg)" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
