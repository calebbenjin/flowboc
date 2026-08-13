import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1d3d2f",
        borderRadius: 7,
        color: "#f7f3eb",
        fontFamily: "Georgia, serif",
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      f
    </div>,
    size,
  );
}
