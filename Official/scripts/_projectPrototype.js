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

// 用途代碼(後端 purposeID,D-39 新增):1 住宅 / 2 店面 / 3 住店 / 4 辦公 / 5 住辦 / 6 廠房 / 7 車位 / 8 土地 / 9 其他。
// 卡片格式只需分辨土地與車位,其餘用途走一般格式,故僅列出這兩個代碼。
export const PURPOSE_ID = {
  PARKING: 7,
  LAND: 8,
}

// 土地:型態欄固定顯示「土地」,不顯示 caseType / 樓層 / 格局;坪數只顯示地坪。
export const onIsLand = (purposeID) => Number(purposeID) === PURPOSE_ID.LAND

// 車位:型態欄固定顯示「車位」,不顯示 caseType;坪數標籤為車坪。
export const onIsParking = (purposeID) => Number(purposeID) === PURPOSE_ID.PARKING

// 帶單位字串:值為 null / undefined / '' 時回傳 null(讓欄位整列隱藏),避免印出「null 年」等。
// 注意:保留 0(如建坪 0 坪)為有效值,不視為空。suffix 自帶前導空白,例如 ' 年'、' 坪'。
export const onUnitText = (value, suffix = '') =>
  value == null || value === '' ? null : `${value}${suffix}`

// email 隱碼:只遮 @ 前的 local part,網域原樣保留。
// 規則(依 local part 長度 → 頭 / 星 / 尾):
//   1  *          全遮(只有 1 字,留了就等於沒遮)
//   2  a*         1 / 1 / 0
//   3  a*c        1 / 1 / 1
//   4  a*cd       1 / 1 / 2
//   5  a**de      1 / 2 / 2
//   6  a***ef     1 / 3 / 2
//   7  ab***fg    2 / 3 / 2
//   8  abc***gh   3 / 3 / 2
// 即:尾段固定 2(長度 3 時為 1),星號最多 3,剩下的全給頭段
// → 長度 9 以上頭段會繼續變長(abcd***hi、abcde***ij …)。
export const onMaskEmail = (email) => {
  const value = String(email ?? '')

  if (!value) return ''

  // 沒有 @ 就整串視為 local part,避免非 email 的字串被原樣曝光
  const atIndex = value.lastIndexOf('@')
  const local = atIndex === -1 ? value : value.slice(0, atIndex)
  const domain = atIndex === -1 ? '' : value.slice(atIndex)

  if (!local) return value

  const { length } = local

  if (length === 1) return `*${domain}`
  if (length === 2) return `${local.slice(0, 1)}*${domain}`

  const tail = length === 3 ? 1 : 2
  const star = Math.min(3, length - 1 - tail)
  const head = length - star - tail

  return `${local.slice(0, head)}${'*'.repeat(star)}${local.slice(length - tail)}${domain}`
}

// 手機隱碼:保留頭 4 碼與尾 3 碼,中間全部遮掉。
//   0912345678 → 0912***678
// 預期傳入純數字字串(表單存的就是這個格式);長度不足 8 時無法保留頭尾,一律全遮。
export const onMaskPhone = (phone) => {
  const value = String(phone ?? '')

  if (!value) return ''
  if (value.length < 8) return '*'.repeat(value.length)

  return `${value.slice(0, 4)}${'*'.repeat(value.length - 7)}${value.slice(-3)}`
}

// 圖片網址的尺寸佔位符替換:{0} → width、{1} → height。
// data 可為字串、物件或兩者的陣列;傳物件時以 key 指定要替換的欄位,其餘欄位原樣保留。
export const onReplaceImageSize = (data, size = {}, key) => {
  const { width = '', height = '' } = size || {}
  const onReplaceString = (str) =>
    typeof str === 'string' ? str.replaceAll('{0}', width).replaceAll('{1}', height) : str

  const onReplaceItem = (item) => {
    // 字串：['xxxx?width={0}&height={1}']
    if (typeof item === 'string') {
      return onReplaceString(item)
    }

    // 物件：[{ key: 'xxxx?width={0}&height={1}' }] 或單一物件
    if (typeof item === 'object' && item !== null) {
      return {
        ...item,
        [key]: onReplaceString(item[key]),
      }
    }

    return item
  }

  if (Array.isArray(data)) {
    return data.map(onReplaceItem)
  }

  return onReplaceItem(data)
}

// 把「可依裝置設定的物件」解析成目前裝置對應的值。device 只會是 p / t / m,
// 故需把 pt / tm 區間對應進來;解析順序為先比單一 device、再比區間。
// 非物件值直接原樣回傳;都沒對應到則回 null。
export const onResolveByDevice = (value, device) => {
  const breakpointDeviceKeys = {
    p: ['p', 'pt'],
    t: ['t', 'pt', 'tm'],
    m: ['m', 'tm'],
  }

  if (value != null && typeof value !== 'object') return value

  const keys = breakpointDeviceKeys[device] || []
  const matchedKey = keys.find((key) => value[key] != null && value[key] !== false)

  return matchedKey !== undefined ? value[matchedKey] : null
}
