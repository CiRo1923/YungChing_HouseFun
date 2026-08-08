// 本檔放「單一專案」專用的 prototype / 格式化工具,避免污染跨專案共用的 _prototype.js。
// 邏輯與 Official/scripts/_projectPrototype.js 對齊,前後台顯示一致。

// 格局字串:房/廳/衛 為 0 或無資料時以 `--` 呈現(而非 0 或 null)。
// 全空(房/廳/衛 皆無值或 0)→ 回 null,讓欄位整列隱藏;只要有任一格有值,空的格才顯示 `--`。
export const onLayoutText = (layout = {}) => {
  const { room, living, bath } = layout || {}

  if (!room && !living && !bath) return null

  const dash = (value) => (value ? value : '--')

  return `${dash(room)} 房 (室) ${dash(living)} 廳 ${dash(bath)} 衛`
}

// 樓層字串:`{from} [~ {to}] / {up} 樓`。from/to/up 為 0 或無值時以 `--` 呈現(如「6 / -- 樓」)。
// 範圍(~ to)只在 to 有值且與 from 不同時顯示。
// 全空(from/to/up 皆無值或 0)→ 回 null,讓欄位整列隱藏。
export const onFloorText = ({ from, to, up } = {}) => {
  if (!from && !to && !up) return null

  const dash = (value) => (value ? value : '--')
  const hasRange = to != null && to !== '' && to !== from

  return `${dash(from)}${hasRange ? ` ~ ${dash(to)}` : ''} / ${dash(up)} 樓`
}
