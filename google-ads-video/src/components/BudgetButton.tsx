import React from "react";
import { C, FONT } from "../theme";

/**
 * The recurring glossy 「加预算」 button.
 *  pressed: 0 (up) … 1 (fully pushed in)
 *  cover:   0 (no glass cover) … 1 (glass cover fully down)
 *  tone:    "red" | "green" | "gray"
 */
export const BudgetButton: React.FC<{
  size?: number;
  pressed?: number;
  cover?: number;
  tone?: "red" | "green" | "gray";
  label?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ size = 420, pressed = 0, cover = 0, tone = "red", label = "加预算", glow = 0, style }) => {
  const s = size / 420;
  const dome = tone === "green" ? [C.green, "#1E7A3A", "#7EE09A"] : tone === "gray" ? ["#A5A5AE", "#6B6B76", "#D6D6DC"] : [C.red, "#A5261B", "#FF8C80"];
  const lift = (1 - pressed) * 44;
  return (
    <div style={{ position: "relative", width: size, height: size * 0.82, ...style }}>
      {/* glow */}
      {glow > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55%",
            width: size * 1.3,
            height: size * 0.9,
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            background: `radial-gradient(${dome[0]}88, transparent 65%)`,
            opacity: glow,
          }}
        />
      ) : null}
      {/* base */}
      <div
        style={{
          position: "absolute",
          left: 20 * s,
          right: 20 * s,
          bottom: 0,
          height: 120 * s,
          background: "#2A2A33",
          border: `${6 * s}px solid ${C.ink}`,
          borderRadius: `${40 * s}px`,
          boxShadow: `${10 * s}px ${10 * s}px 0 ${C.ink}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 20 * s,
          right: 20 * s,
          bottom: 60 * s,
          height: 80 * s,
          background: "#3A3A45",
          border: `${6 * s}px solid ${C.ink}`,
          borderRadius: "50%",
        }}
      />
      {/* dome side */}
      <div
        style={{
          position: "absolute",
          left: 60 * s,
          right: 60 * s,
          bottom: 92 * s,
          height: (60 + lift) * s,
          background: dome[1],
          borderLeft: `${6 * s}px solid ${C.ink}`,
          borderRight: `${6 * s}px solid ${C.ink}`,
        }}
      />
      {/* dome top */}
      <div
        style={{
          position: "absolute",
          left: 60 * s,
          right: 60 * s,
          bottom: (112 + lift) * s,
          height: 96 * s,
          background: `radial-gradient(ellipse at 40% 35%, ${dome[2]}, ${dome[0]} 60%)`,
          border: `${6 * s}px solid ${C.ink}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT.display,
            fontSize: 64 * s,
            color: C.paper,
            textShadow: `${3 * s}px ${3 * s}px 0 ${C.ink}`,
            transform: "scaleY(0.78)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      {/* dome bottom cap (hides seam) */}
      <div
        style={{
          position: "absolute",
          left: 60 * s,
          right: 60 * s,
          bottom: 62 * s,
          height: 60 * s,
          background: dome[1],
          border: `${6 * s}px solid ${C.ink}`,
          borderTop: "none",
          borderRadius: `0 0 50% 50% / 0 0 100% 100%`,
        }}
      />
      {/* glass cover */}
      {cover > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 34 * s,
            right: 34 * s,
            bottom: 70 * s,
            height: 250 * s,
            transform: `translateY(${-(1 - cover) * 320 * s}px)`,
            opacity: Math.min(1, cover * 2),
            background: "linear-gradient(120deg, rgba(255,255,255,0.55), rgba(180,220,255,0.25) 40%, rgba(255,255,255,0.35))",
            border: `${6 * s}px solid ${C.ink}`,
            borderRadius: `${150 * s}px ${150 * s}px ${24 * s}px ${24 * s}px`,
            boxShadow: `inset ${14 * s}px ${10 * s}px 0 rgba(255,255,255,0.5)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -34 * s,
              width: 60 * s,
              height: 34 * s,
              transform: "translateX(-50%)",
              background: "#CFE6FF",
              border: `${6 * s}px solid ${C.ink}`,
              borderRadius: `${14 * s}px ${14 * s}px 0 0`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
