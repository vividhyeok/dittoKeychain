// lib/perfPath.ts
export function crossPerfPaths(cx: number, cy: number, halfArm: number, w: number) {
  // 수평/수직 직사각형 두 개(팔 두께 w), 중심 (cx, cy)
  const h = w;
  const rectH = `M ${cx - halfArm},${cy - h / 2} h ${2 * halfArm} v ${h} h ${-2 * halfArm} Z`;
  const rectV = `M ${cx - h / 2},${cy - halfArm} v ${2 * halfArm} h ${h} v ${-2 * halfArm} Z`;
  return [rectH, rectV];
}