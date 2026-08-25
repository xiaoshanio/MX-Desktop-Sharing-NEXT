import type { ReactNode } from "react";

/**
 * The MX mark — "node + uplink".
 *
 * An isometric cube (the LiveKit node a room is pinned to) with a chevron lifting off it
 * (the stream going out). Both elements are built on a single 2:1 isometric slope, so the
 * chevron's arms run exactly parallel to the cube's top edges and the gap between them stays
 * constant across the whole width. That shared slope is what makes the two shapes read as one
 * mark rather than two stacked objects.
 *
 * Drawn on a 32-unit grid, optically centred on (16, 16).
 */
const FACE_TOP = "M16 12.8L26 17.8L16 22.8L6 17.8Z";
const FACE_RIGHT = "M26 17.8L26 22.3L16 27.3L16 22.8Z";
const FACE_LEFT = "M6 17.8L6 22.3L16 27.3L16 22.8Z";
const SIGNAL = "M7 11.2L16 6.7L25 11.2";
const SIGNAL_WIDTH = 3.6;

export interface BrandMarkProps {
  /** Rendered box size in px. The mark scales as a unit. */
  size?: number;
  className?: string;
}

/**
 * Full-colour mark on a transparent ground. Facet colours come from `--mx-mark-*`, so the
 * lighting stays correct in both themes instead of inverting the way flat opacity would.
 */
export function BrandMark({ size = 32, className }: BrandMarkProps): ReactNode {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="MX 桌面共享"
    >
      <path d={FACE_LEFT} fill="var(--mx-mark-left)" />
      <path d={FACE_RIGHT} fill="var(--mx-mark-right)" />
      <path d={FACE_TOP} fill="var(--mx-mark-top)" />
      <path
        d={SIGNAL}
        fill="none"
        stroke="var(--mx-mark-signal)"
        strokeWidth={SIGNAL_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Single-colour variant in `currentColor`, shaded with opacity. Use where only one ink is
 * available (dense chrome, print, a surface that already carries the brand colour).
 */
export function BrandGlyph({ size = 20, className }: BrandMarkProps): ReactNode {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={FACE_LEFT} opacity="0.48" />
      <path d={FACE_RIGHT} opacity="0.72" />
      <path d={FACE_TOP} />
      <path
        d={SIGNAL}
        fill="none"
        stroke="currentColor"
        strokeWidth={SIGNAL_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
