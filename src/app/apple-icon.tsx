import { ImageResponse } from "next/og";
import { DozenMarkBoxes } from "@/lib/dozen-mark-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DozenMarkBoxes size={180} />
      </div>
    ),
    { ...size },
  );
}
