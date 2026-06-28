/**
 * 折線 / 平滑曲線的「逐段」路徑產生器
 * 之所以逐段（每兩點一個 <path>），是為了讓「補值段落」能單獨上虛線。
 * 每段回傳 { d, dashed, from, to }：
 *   - dashed：from / to 任一端為補值點（dashed）時為 true
 *   - line  ：直線段  M..L..
 *   - spline：Catmull-Rom 平滑段 M..C..（不會因為平滑而失去逐段切換虛線的能力）
 */
const useChartPath = () => {
  // 直線：每兩點一段
  const lineSegments = (pts) =>
    pts.slice(0, -1).map((p, i) => {
      const next = pts[i + 1]
      return {
        d: `M${p.x},${p.y}L${next.x},${next.y}`,
        dashed: Boolean(p.dashed || next.dashed),
        from: p,
        to: next,
      }
    })

  // 平滑曲線：用 Catmull-Rom 轉三次貝茲，逐段輸出
  const splineSegments = (pts) => {
    const segs = []
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] ?? pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] ?? pts[i + 1]

      const c1x = p1.x + (p2.x - p0.x) / 6
      const c1y = p1.y + (p2.y - p0.y) / 6
      const c2x = p2.x - (p3.x - p1.x) / 6
      const c2y = p2.y - (p3.y - p1.y) / 6

      segs.push({
        d: `M${p1.x},${p1.y}C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`,
        dashed: Boolean(p1.dashed || p2.dashed),
        from: p1,
        to: p2,
      })
    }
    return segs
  }

  const buildSegments = (type, pts) =>
    type === 'spline' ? splineSegments(pts) : lineSegments(pts)

  return { lineSegments, splineSegments, buildSegments }
}

export default useChartPath
