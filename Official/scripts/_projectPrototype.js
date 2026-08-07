// 本檔放「單一專案」專用的 prototype / 格式化工具,避免污染跨專案共用的 _prototype.js。

// 格局字串:房/廳/衛 為 0 或無資料時以 `--` 呈現(而非 0),跨頁一致(明細基本資料 / 主資訊)。
// 全空(房/廳/衛 皆無值或 0)→ 回 null,讓欄位整列隱藏;只要有任一格有值,空的格才顯示 `--`。
export const onLayoutText = (layout = {}) => {
  const { room, living, bath } = layout || {}

  if (!room && !living && !bath) return null

  const dash = (value) => (value ? value : '--')

  return `${dash(room)} 房 (室) ${dash(living)} 廳 ${dash(bath)} 衛`
}

// 樓層字串:`{from} [~ {to}] / {up} 樓`。from/to/up 為 0 或無值時以 `--` 呈現(如「6 / -- 樓」)。
// 範圍(~ to)只在 to 有值且與 from 不同時顯示。
export const onFloorText = ({ from, to, up } = {}) => {
  const dash = (value) => (value ? value : '--')
  const hasRange = to != null && to !== '' && to !== from

  return `${dash(from)}${hasRange ? ` ~ ${dash(to)}` : ''} / ${dash(up)} 樓`
}

// 帶單位字串:值為 null / undefined / '' 時回傳 null(讓欄位整列隱藏),避免印出「null 年」等。
// 注意:保留 0(如建坪 0 坪)為有效值,不視為空。suffix 自帶前導空白,例如 ' 年'、' 坪'。
export const onUnitText = (value, suffix = '') =>
  value == null || value === '' ? null : `${value}${suffix}`
