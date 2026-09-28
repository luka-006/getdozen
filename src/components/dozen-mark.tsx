import {
  DOZEN_MARK_BLUE as BLUE,
  DOZEN_MARK_DOT_R,
  DOZEN_MARK_DOTS,
  DOZEN_MARK_SPINE,
  DOZEN_MARK_VIEW,
  DOZEN_MARK_YELLOW as YELLOW,
} from "@/lib/dozen-mark-data";

type Props = {
  className?: string;
  title?: string;
  /** Pulse the earned credit dot on load (landing hero). */
  tick?: boolean;
};

/**
 * Dozen mark — D spine + ring of twelve dots (one golden credit).
 */
export function DozenMark({ className = "h-8 w-8", title, tick }: Props) {
  const { x, y, width, height, rx } = DOZEN_MARK_SPINE;

  return (
    <svg
      viewBox={`0 0 ${DOZEN_MARK_VIEW} ${DOZEN_MARK_VIEW}`}
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect x={x} y={y} width={width} height={height} rx={rx} fill={BLUE} />
      {DOZEN_MARK_DOTS.map((dot, i) => {
        const fill = dot.golden ? YELLOW : BLUE;
        const tickClass = dot.golden && tick ? "dozen-tick" : undefined;
        return (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={DOZEN_MARK_DOT_R}
            fill={fill}
            className={tickClass}
          />
        );
      })}
    </svg>
  );
}
