/**
 * 成交均價趨勢：缺月補值
 * 把後端的稀疏月資料（可能缺月）整理成圖表要的連續陣列。
 * 補進來的月份標記 dashed:true，圖表會自動畫成虛線。
 *
 * 資料契約：每點 { label, value }（其餘欄位原樣保留，供 tooltip 取用）。
 * 仍容忍舊欄位（monthLabel / unitPrice）作為 label / value 的後備。
 * 回傳格式： { categories:['11月',...], data:[{ y, dashed, raw }] }
 */
const useChartFill = () => {
  // 'YYYY-MM-DD' → 絕對月份索引（年*12+月），避開時區問題
  const toMonthIndex = (dateStr) => {
    const [y, m] = String(dateStr).split('-').map(Number)
    return y * 12 + (m - 1)
  }

  const monthLabel = (absIndex) => `${(absIndex % 12) + 1}月`
  // 契約 value/label 優先，後備舊欄位
  const valueOf = (d) => d.value ?? d.unitPrice ?? d.y
  const labelOf = (d, idx) =>
    d.label ?? d.monthLabel ?? d.name ?? (idx != null ? monthLabel(idx) : '')

  // 由月份標籤推算前/後 N 個月（'11月' → '10月'｜'1月' → '12月'），跨年自動繞回。
  // 非「N月」格式回空字串。可當圖表 xAxis.padLabel 的策略。
  const monthShift = (label, delta) => {
    const n = parseInt(label, 10)
    if (Number.isNaN(n)) return ''
    return `${(((n - 1 + delta) % 12) + 12) % 12 + 1}月`
  }

  /**
   * @param {Array}  raw                原始趨勢資料
   * @param {Object} options
   * @param {boolean} options.fillGap   是否補缺月（預設 true）
   * @param {'interpolate'|number} options.value  補值方式：前後內插 或 固定數字
   */
  const fillMonths = (raw = [], { fillGap = true, value = 'interpolate' } = {}) => {
    const list = [...raw].filter((d) => d != null)
    // 缺月補值需要 date 才能算間距；沒有 date 就只透傳、不補
    const hasDates = list.length > 0 && list.every((d) => d.date)
    const sorted = hasDates
      ? [...list].sort((a, b) => toMonthIndex(a.date) - toMonthIndex(b.date))
      : list

    const categories = []
    const data = []

    sorted.forEach((item, i) => {
      // 兩筆真實資料之間補缺月
      if (i > 0 && fillGap && hasDates) {
        const prev = sorted[i - 1]
        const prevIdx = toMonthIndex(prev.date)
        const gap = toMonthIndex(item.date) - prevIdx

        for (let g = 1; g < gap; g += 1) {
          const filled =
            typeof value === 'number'
              ? value
              : valueOf(prev) + ((valueOf(item) - valueOf(prev)) * g) / gap

          categories.push(monthLabel(prevIdx + g))
          data.push({ y: Number(filled.toFixed(1)), dashed: true, raw: { isFilled: true } })
        }
      }

      categories.push(labelOf(item, hasDates ? toMonthIndex(item.date) : null))
      data.push({ y: valueOf(item), dashed: false, raw: item }) // raw 保留原始點供 tooltip
    })

    return { categories, data }
  }

  return { fillMonths, monthShift }
}

export default useChartFill
