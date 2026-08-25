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

// 地址文字正規化,供跨來源比對用。
// Google Geocoding 回的是官方寫法「臺北市」,後端選項用的是「台北市」,直接 === 會對不上
// (臺北 / 臺中 / 臺南 / 臺東 都中招)。比對時「兩邊」都要過一次 —— 只轉其中一邊,
// 等於賭另一邊永遠不改寫法。
export const onNormalizeAddressText = (value) => String(value ?? '').replace(/臺/g, '台')

// 單一樓層的顯示字:負數為地下樓,以 B 表示(-2 → B2)。0 或無值回 null,交由呼叫端補 `--`。
const onFloorValue = (value) => {
  if (!value) return null

  return value < 0 ? `B${Math.abs(value)}` : `${value}`
}

// 樓層字串:`{from} [~ {to}] / {up} 樓`。from/to/up 為 0 或無值時以 `--` 呈現(如「6 / -- 樓」)。
// 範圍(~ to)只在 to 有值且與 from 不同時顯示。
// 全空(from/to/up 皆無值或 0)→ 回 null,讓欄位整列隱藏。
// from / to 帶正負號:正為地上、負為地下,呼叫端要先把 API 的樓層值乘上方向。
export const onFloorText = ({ from, to, up } = {}) => {
  if (!from && !to && !up) return null

  const dash = (value) => onFloorValue(value) ?? '--'
  const hasRange = to != null && to !== '' && to !== from

  return `${dash(from)}${hasRange ? ` ~ ${dash(to)}` : ''} / ${dash(up)} 樓`
}
