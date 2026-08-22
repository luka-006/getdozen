import { ImageResponse } from "next/og";
import { DOZEN_BRAND_BLUE, DOZEN_MARK_INK } from "@/lib/dozen-mark-data";
import { DozenMarkBoxes } from "@/lib/dozen-mark-image";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = "Dozen — Test apps. Earn. Get feedback.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadArchivo() {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Archivo:wght@700&text=DozenTestappsEarnGetfeedback.",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((res) => res.text());
    const match = css.match(/src: url\(([^)]+)\)/);
    if (!match?.[1]) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const archivo = await loadArchivo();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: DOZEN_MARK_INK,
          color: "#ffffff",
          padding: "72px 80px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <DozenMarkBoxes size={112} />
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "0.04em",
                fontFamily: archivo ? "Archivo" : "sans-serif",
              }}
            >
              {SITE_NAME}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.25,
              fontFamily: archivo ? "Archivo" : "sans-serif",
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 6,
              background: DOZEN_BRAND_BLUE,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: archivo
        ? [
            {
              name: "Archivo",
              data: archivo,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    },
  );
}
