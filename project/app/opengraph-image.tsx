import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "홈해버 — 대한민국 분양의 모든 정보를 연결하다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FBF7EE 0%, #F5F5F5 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #DCB65E, #A8842E)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 0,
              height: 0,
              borderLeft: "27px solid transparent",
              borderRight: "27px solid transparent",
              borderBottom: "27px solid white",
              marginBottom: -2,
            }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "#181410" }}>홈해버</div>
        <div style={{ display: "flex", fontSize: 30, color: "#A8842E", marginTop: 18, fontWeight: 600 }}>
          대한민국 분양의 모든 정보를 연결하다
        </div>
      </div>
    ),
    { ...size }
  );
}
