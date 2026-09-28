import {
  DOZEN_MARK_BLUE,
  DOZEN_MARK_DOT_R,
  DOZEN_MARK_DOTS,
  DOZEN_MARK_INK,
  DOZEN_MARK_SPINE,
  DOZEN_MARK_VIEW,
  DOZEN_MARK_YELLOW,
} from "@/lib/dozen-mark-data";

/** Mark renderer for `next/og` ImageResponse (no SVG). */
export function DozenMarkBoxes({
  size,
  background,
}: {
  size: number;
  background?: string;
}) {
  const scale = size / DOZEN_MARK_VIEW;
  const spine = {
    left: DOZEN_MARK_SPINE.x * scale,
    top: DOZEN_MARK_SPINE.y * scale,
    width: DOZEN_MARK_SPINE.width * scale,
    height: DOZEN_MARK_SPINE.height * scale,
    radius: DOZEN_MARK_SPINE.rx * scale,
  };
  const dotR = DOZEN_MARK_DOT_R * scale;

  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        position: "relative",
        background: background ?? DOZEN_MARK_INK,
        borderRadius: Math.round(size * 0.18),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: spine.left,
          top: spine.top,
          width: spine.width,
          height: spine.height,
          background: DOZEN_MARK_BLUE,
          borderRadius: spine.radius,
        }}
      />
      {DOZEN_MARK_DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: dot.x * scale - dotR,
            top: dot.y * scale - dotR,
            width: dotR * 2,
            height: dotR * 2,
            background: dot.golden ? DOZEN_MARK_YELLOW : DOZEN_MARK_BLUE,
            borderRadius: dotR,
          }}
        />
      ))}
    </div>
  );
}
