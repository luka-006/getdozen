import { ImageResponse } from "next/og";
import { DozenMarkBoxes } from "@/lib/dozen-mark-image";

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
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
        <DozenMarkBoxes size={96} />
      </div>
    ),
    { ...size },
  );
}
