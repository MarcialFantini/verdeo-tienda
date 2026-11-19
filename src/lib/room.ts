/** Room dimensions (cm) for the "En tu ambiente" scene, and the inverse isometric mapping. */
export const ROOM = { W: 400, D: 340, H: 260 } as const;

const C = Math.cos(Math.PI / 6);
const S = 0.5;

/** Screen delta (SVG units) to floor delta (cm) on the z = 0 plane. */
export function floorFromScreen(sx: number, sy: number): { dx: number; dy: number } {
  const a = sx / C;
  const b = sy / S;
  return { dx: (a + b) / 2, dy: (b - a) / 2 };
}
