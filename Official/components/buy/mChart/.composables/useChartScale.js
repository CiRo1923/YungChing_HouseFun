/**
 * 圖表座標轉換（純數學，無依賴）
 * - linear：數值域 → 像素域 的線性映射
 * - point ：等距分佈第 i 個類別到像素域（折線圖 x 軸用）
 * - niceTicks：自動算出漂亮的軸刻度（0 / 20 / 40 ...）
 */
const useChartScale = () => {
  // 線性 scale：domain [d0,d1] → range [r0,r1]
  const linear = ([d0, d1], [r0, r1]) => (value) => {
    if (d1 === d0) return r0
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0)
  }

  // 等距 point scale：count 個點平均分佈在 range 上，回傳第 i 個的座標
  const point = (count, [r0, r1]) => (index) => {
    if (count <= 1) return (r0 + r1) / 2
    return r0 + (index / (count - 1)) * (r1 - r0)
  }

  // 自動刻度：給定資料 min/max，回傳 { min, max, step, ticks }
  // 可用 interval 指定固定間距、用 count 指定大約幾條刻度
  const niceTicks = ({ min = 0, max = 0, count = 5, interval = null }) => {
    let step = interval

    if (!step) {
      const span = max - min || 1
      const rough = span / Math.max(count - 1, 1)
      const pow = 10 ** Math.floor(Math.log10(rough))
      const factor = [1, 2, 2.5, 5, 10].find((c) => c * pow >= rough) ?? 10
      step = factor * pow
    }

    const niceMin = Math.floor(min / step) * step
    const niceMax = Math.ceil(max / step) * step
    const ticks = []
    for (let v = niceMin; v <= niceMax + step * 1e-6; v += step) {
      ticks.push(Number(v.toFixed(6)))
    }

    return { min: niceMin, max: niceMax, step, ticks }
  }

  return { linear, point, niceTicks }
}

export default useChartScale
