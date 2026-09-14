// 把「可依裝置設定的物件」解析成目前裝置對應的值。device 只會是 p / t / m,
// 故需把 pt / tm 區間對應進來;解析順序為先比單一 device、再比區間。
// 非物件值直接原樣回傳;都沒對應到則回 null。
//
// null / undefined 也走原樣回傳那一條:typeof null 是 'object',不特別擋的話
// 它會被當成裝置物件,往下讀 value[key] 就是讀 null 的屬性。
//
// 這一份寫在元件自己的核心裡,不從共用函式檔取用 —— 這個元件要能整包搬到
// 別的專案,少一個外部依賴就少一個搬過去會斷掉的地方。
export const onResolveByDevice = (value, device) => {
  const breakpointDeviceKeys = {
    p: ['p', 'pt'],
    t: ['t', 'pt', 'tm'],
    m: ['m', 'tm'],
  }

  if (value == null || typeof value !== 'object') return value

  const keys = breakpointDeviceKeys[device] || []
  const matchedKey = keys.find((key) => value[key] != null && value[key] !== false)

  return matchedKey !== undefined ? value[matchedKey] : null
}
