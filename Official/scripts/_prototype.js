// 遞迴
export const onRecursive = (obj, key, exec, finish) => {
  let recursiveIndex = 0
  const arrayWithoutHoles = (arr) => {
    const toArray = () => {
      const len = arr.length
      const arr2 = new Array(len)

      for (let i = 0; i < len; i += 1) {
        arr2[i] = arr[i]
      }

      return arr2
    }

    if (Array.isArray(arr)) {
      return toArray()
    }
  }
  const buildPath = (parentPath, index) =>
    parentPath ? [].concat(arrayWithoutHoles(parentPath), [index]) : []

  const visit = (node, parentPath, index) => {
    const path = buildPath(parentPath, index)

    exec(node, path)

    if (node[key]) {
      foeEach(node[key], path)
    }
  }

  const foeEach = (object, parentPath) => {
    recursiveIndex++

    if (object.constructor === Object) {
      visit(object, parentPath, 0)
    } else {
      for (let i = 0; i < object.length; i += 1) {
        visit(object[i], parentPath, i)
      }
    }

    if (--recursiveIndex === 0 && finish) {
      finish(object)
    }

    return object
  }

  foeEach(obj, [])
}

// 深度複製
export const onDeepClone = (obj, callback) => {
  let object = null

  if (obj == null || typeof obj !== 'object') return obj
  if (obj.constructor !== Object && obj.constructor !== Array) return obj
  if (
    obj.constructor === Date ||
    obj.constructor === RegExp ||
    obj.constructor === Function ||
    obj.constructor === String ||
    obj.constructor === Number ||
    obj.constructor === Boolean
  )
    return new obj.constructor(obj)

  object = object || new obj.constructor()

  for (const name in obj) {
    object[name] = typeof object[name] === 'undefined' ? onDeepClone(obj[name]) : object[name]
  }

  if (callback) {
    callback(object)
  }

  return object
}

// 深度合併
export const onDeepMerge = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift()
  const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item)
  }
  const isShallow = (item) => {
    return !(Array.isArray(item) && item.some((value) => typeof value === 'object'))
  }

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })

        onDeepMerge(target[key], source[key])
      } else if (isShallow(source[key])) {
        Object.assign(target, { [key]: source[key] })
      } else {
        if (!target[key]) Object.assign(target, { [key]: [] })
        Object.assign(target, {
          [key]: source[key].map((item, index) => onDeepMerge(target[key][index] || item, item)),
        })
      }
    }
  }

  return onDeepMerge(target, ...sources)
}

// 清空物件資料
export const onEmptyData = (obj) => {
  return onDeepClone(obj, (data) => {
    for (const key in obj) {
      if (data[key]) {
        if (typeof data[key] === 'string') {
          data[key] = ''
        } else if (typeof data[key] === 'number') {
          data[key] = null
        } else if (Array.isArray(data[key])) {
          data[key] = []
        } else if (typeof data[key] !== 'boolean') {
          data[key] = {}
        }
      }
    }
  })
}

// 小數點設定
// number 可傳單一數值，或傳陣列（會先加總）
export const onToFixed = (number, fixed) => {
  // 取單一值的小數位數
  const decimalLength = (value) =>
    value && /\./.test(value) ? (value + '').split('.')[1].length : 0

  // fixed 未帶值時，用「傳入的值」的小數位數當預設（陣列取各值的最大位數）
  // 避免加總後的浮點誤差（如 1.1 + 2.2 = 3.3000000000000003）影響位數判斷
  const length = Array.isArray(number)
    ? number.reduce((max, item) => Math.max(max, decimalLength(item)), 0)
    : decimalLength(number)

  // 陣列時先加總（忽略 null/undefined/空字串），其餘維持原本邏輯
  if (Array.isArray(number)) {
    number = number.reduce((sum, item) => {
      const value = Number(item)
      return item == null || item === '' || Number.isNaN(value) ? sum : sum + value
    }, 0)
  }

  const fix = fixed === undefined ? length : fixed
  let result = Number(`${Math.round(Number(`${number}e+${fix}`))}e-${fix}`) || 0

  // 小數位數不足時補 0（位數剛好則維持原本的 number 型別）
  if (fix) {
    const [integer, decimal = ''] = String(result).split('.')
    if (decimal.length < fix) {
      result = `${integer}.${decimal.padEnd(fix, '0')}`
    }
  }

  return number || number === 0 ? result : null
}

// 千分位設定
export const numberComma = {
  add(number, isReturnZero = true) {
    if (number === null || number === undefined || number === '') {
      return isReturnZero ? '0' : ''
    }

    const str = typeof number === 'number' ? String(number) : number
    const [integer, decimal] = str.split('.')
    const integerWithComma = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return decimal === undefined ? integerWithComma : `${integerWithComma}.${decimal}`
  },

  remove(number, isReturnZero = true) {
    if (number === null || number === undefined || number === '') {
      return isReturnZero ? '0' : ''
    }

    return String(number).replaceAll(',', '')
  },
}

// 補 0
export const onAddZero = (number) => {
  const value = typeof number === 'string' ? Number(number) : number

  return value > 9 ? String(value) : `0${value}`
}

// 格式化日期
export const onFormatDate = (date, format) => {
  // ---- helpers ----
  const pad2 = (n) => String(n).padStart(2, '0')

  const parseTimeFromDateString = (input) => {
    // 原本邏輯是「format 需要 hh/mm/ss 且 date 字串含有時間」才抓，不然補 00
    // 這邊一樣：只抓 "HH:MM:SS" 形式
    const m = typeof input === 'string' ? /(\d{1,2}):(\d{1,2}):(\d{1,2})/.exec(input) : null
    if (!m) return null
    return {
      hh: pad2(Number(m[1])),
      h: String(Number(m[1])),
      mm: pad2(Number(m[2])),
      m: String(Number(m[2])),
      ss: pad2(Number(m[3])),
      s: String(Number(m[3])),
    }
  }

  const toLocalYMD = (ms) => {
    // 避免 toISOString() 的 UTC 切日，改成本地日期
    const d = new Date(ms)
    const y = d.getFullYear()
    const m = pad2(d.getMonth() + 1)
    const day = pad2(d.getDate())
    return { YYYY: String(y), MM: m, DD: day }
  }

  const safeMsFromYMD = (y, mo, d, hh, mm, ss) => {
    // 手動組出 Date(year, monthIndex, day, ...) 避開 iOS 對字串解析
    // 若沒有時間，固定用 12:00:00 避免時區切日
    const hasTime = hh != null && mm != null && ss != null
    const H = hasTime ? hh : 12
    const M = hasTime ? mm : 0
    const S = hasTime ? ss : 0
    const dt = new Date(y, mo - 1, d, H, M, S, 0)
    const ms = dt.getTime()
    return Number.isNaN(ms) ? null : ms
  }

  const parseIsoWithTzToMs = (s) => {
    // 新增：處理 ISO 8601 含「小數秒 + 時區」的字串
    // 例：2026-02-03T17:50:08.5662303+08:00
    // 同時支援：
    // 1) Z 結尾（UTC）
    // 2) 沒有小數秒（2026-02-03T17:50:08+08:00）
    // 3) 沒有冒號的 offset（+0800）
    // 說明：避免依賴 new Date(string) 的解析（iOS 對此類格式常不穩定），改為手動計算 UTC ms
    const m = String(s)
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-])(\d{2}):?(\d{2}))$/
      )
    if (!m) return null

    const y = +m[1]
    const mo = +m[2]
    const d = +m[3]
    const hh = +m[4]
    const mm = +m[5]
    const ss = +m[6]

    // 小數秒可能很多位（例如 5662303），JS 只能到毫秒
    // 取前三位並右補 0，轉為毫秒
    const frac = (m[7] || '').slice(0, 3).padEnd(3, '0')
    const msPart = frac ? +frac : 0

    // 先以 Date.UTC 組出「假設為 UTC」的時間
    let utcMs = Date.UTC(y, mo - 1, d, hh, mm, ss, msPart)

    // 若帶有 offset（+08:00 / -05:30 等），需換算成真正的 UTC ms
    // +08:00 表示當地時間比 UTC 快 8 小時，所以要扣回去
    if (m[8]) {
      const sign = m[8] === '+' ? 1 : -1
      const offH = +m[9]
      const offM = +m[10]
      const offsetMin = sign * (offH * 60 + offM)
      utcMs -= offsetMin * 60 * 1000
    }

    return Number.isNaN(utcMs) ? null : utcMs
  }

  // 解析各種日期字串格式（已去頭尾空白、非空）
  const parseDateTimeString = (s) => {
    // YYYYMMDD
    if (/^\d{8}$/.test(s)) {
      const y = parseInt(s.slice(0, 4), 10)
      const mo = parseInt(s.slice(4, 6), 10)
      const d = parseInt(s.slice(6, 8), 10)
      return safeMsFromYMD(y, mo, d)
    }

    // YYYY-MM-DD / YYYY/MM/DD
    const ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s)
    if (ymd) {
      return safeMsFromYMD(parseInt(ymd[1], 10), parseInt(ymd[2], 10), parseInt(ymd[3], 10))
    }

    // YYYY-MM-DD HH:mm:ss / YYYY/MM/DD HH:mm:ss / YYYY-MM-DDTHH:mm:ss
    const ymdhms = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:T|\s)(\d{1,2}):(\d{1,2}):(\d{1,2})$/.exec(
      s
    )
    if (ymdhms) {
      const [, y, mo, d, hh, mm, ss] = ymdhms.map((v) => parseInt(v, 10))
      return safeMsFromYMD(y, mo, d, hh, mm, ss)
    }

    // 新增：ISO 8601 with fractional seconds + timezone
    // 例如：2026-02-03T17:50:08.5662303+08:00
    const isoMs = parseIsoWithTzToMs(s)
    if (isoMs != null) return isoMs

    // string / others
    // 這裡仍然可能因格式太自由而不穩，所以先把 '-' 轉成 '/'
    // 舊 iOS 對 '/' 相對友善一點
    const ms = +new Date(s.replaceAll('-', '/'))
    return Number.isNaN(ms) ? null : ms
  }

  const parseToMs = (input) => {
    if (!input && input !== 0) return null

    // Date 物件
    if (input instanceof Date) {
      const ms = input.getTime()
      return Number.isNaN(ms) ? null : ms
    }

    // number (timestamp)
    if (typeof input === 'number') {
      const d = new Date(input)
      return Number.isNaN(d.getTime()) ? null : input
    }

    // .NET: /Date(1690000000000+0800)/
    if (typeof input === 'string' && /^\/Date/.test(input)) {
      const m = /\((\d+)(?:[-+]\d+)?\)/.exec(input)
      return m ? Number(m[1]) : null
    }

    const s = String(input).trim()
    if (!s) return null

    return parseDateTimeString(s)
  }

  // ---- main ----
  const ms = parseToMs(date)
  if (ms == null) return ''

  // format 沒帶值：回傳計算好的日期 timestamp（轉成字串，與其他分支型別一致）
  // (+new Date(ms) === ms，但寫清楚符合需求)
  if (!format || !String(format).trim()) {
    return String(+new Date(ms))
  }

  const fmt = String(format).trim()
  const timeTokenIndex = fmt.search(/hh|h|mm|m|ss|s/)
  const dateFmt = timeTokenIndex === -1 ? fmt : fmt.slice(0, timeTokenIndex).trim()

  // 用本地取日期（避免 UTC 切日）
  const ymd = toLocalYMD(ms)
  const dateTokens = {
    YYYY: ymd.YYYY,
    YYY: String(Number(ymd.YYYY) - 1911),
    MM: ymd.MM,
    M: String(Number(ymd.MM)),
    DD: ymd.DD,
    D: String(Number(ymd.DD)),
  }

  // 組日期字串
  let dateStr = ''
  dateStr = dateFmt.replace(/YYYY|YYY|MM|M|DD|D/g, (token) => dateTokens[token])

  // 組時間字串（只在 format 有 hh/mm/ss 才開始帶時間）
  let timeStr = ''
  const needsTime = /hh|h|mm|m|ss|s/.test(fmt)

  if (needsTime) {
    const t = parseTimeFromDateString(date) || {
      hh: '00',
      h: '0',
      mm: '00',
      m: '0',
      ss: '00',
      s: '0',
    }

    // 最穩方式：直接用原 fmt 的時間部分（從第一個 h/m/s token 開始）
    const idx = timeTokenIndex
    if (idx !== -1) {
      const timeFmt = fmt.slice(idx)
      const tStr = timeFmt.replace(/hh|h|mm|m|ss|s/g, (token) => t[token])
      timeStr = ` ${tStr}`
    }
  }

  return `${dateStr}${timeStr}`
}

// 計算日期
export const onValueToDateRange = (today, date, format) => {
  // ---- helpers (all inside) ----
  const pad2 = (n) => String(n).padStart(2, '0')

  // 輸出 YYYY-MM-DD
  const formatYMD = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`

  // 以 UTC 方式建立一個「日曆日期」(用 UTC noon 避免任何跨日)
  const makeUtcDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))

  const getYMDFromUtcDate = (dt) => {
    return {
      y: dt.getUTCFullYear(),
      m: dt.getUTCMonth() + 1,
      d: dt.getUTCDate(),
    }
  }

  // 取某個瞬間在 UTC 的年月日，轉成「日曆日期」(UTC noon)
  const calendarDateOf = (d0) =>
    makeUtcDate(d0.getUTCFullYear(), d0.getUTCMonth() + 1, d0.getUTCDate())

  // 同上，但無效日期回 null
  const safeCalendarDate = (d0) => (isNaN(d0.getTime()) ? null : calendarDateOf(d0))

  const parseUtcDateString = (s) => {
    // .NET: /Date(1690000000000+0800)/
    if (s.startsWith('/Date')) {
      const m = /\((\d+)(?:[-+]\d+)?\)/.exec(s)
      return m ? safeCalendarDate(new Date(Number(m[1]))) : null
    }

    // YYYYMMDD
    if (/^\d{8}$/.test(s)) {
      const dt = makeUtcDate(
        parseInt(s.slice(0, 4), 10),
        parseInt(s.slice(4, 6), 10),
        parseInt(s.slice(6, 8), 10)
      )
      return isNaN(dt.getTime()) ? null : dt
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s)
    if (ymd) {
      const dt = makeUtcDate(parseInt(ymd[1], 10), parseInt(ymd[2], 10), parseInt(ymd[3], 10))
      return isNaN(dt.getTime()) ? null : dt
    }

    // 其他格式：先把 '-' 轉成 '/' 再 new Date，盡量避開舊 iOS 坑
    // 但這條路本來就不保證所有格式都穩，能不用就不用
    return safeCalendarDate(new Date(s.replaceAll('-', '/')))
  }

  // 支援 number / Date / 'YYYY-MM-DD' / 'YYYY/MM/DD' / 'YYYYMMDD' / .NET /Date(...)/
  // 注意：絕對不使用 new Date('YYYY-MM-DD')，避免舊 iOS/Safari 解析坑
  const parseToUtcDate = (v) => {
    // Date 物件維持原行為（不做 NaN 檢查）
    if (v instanceof Date) return calendarDateOf(v)

    if (typeof v === 'number') return safeCalendarDate(new Date(v))

    const s = String(v || '').trim()
    if (!s) return null

    return parseUtcDateString(s)
  }

  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()

  const addDays = (dt, n) => {
    const d = new Date(dt)
    d.setUTCDate(d.getUTCDate() + n)
    return d
  }

  const addMonthsSafe = (dt, months) => {
    const y = dt.getUTCFullYear()
    const m0 = dt.getUTCMonth() + 1
    const d0 = dt.getUTCDate()

    const targetIndex = m0 - 1 + months
    const targetY = y + Math.floor(targetIndex / 12)
    const targetM = (((targetIndex % 12) + 12) % 12) + 1

    const maxD = daysInMonth(targetY, targetM)
    const nextD = Math.min(d0, maxD)

    return makeUtcDate(targetY, targetM, nextD)
  }

  const addYearsSafe = (dt, years) => addMonthsSafe(dt, years * 12)

  // ---- main ----
  const base = parseToUtcDate(today)
  if (!base) return null

  const baseYMD = getYMDFromUtcDate(base)
  const todayStr = formatYMD(baseYMD.y, baseYMD.m, baseYMD.d)

  const input = String(date || '')
    .trim()
    .toLowerCase()

  // now year => [今年1/1, 今年今天]
  if (input === 'now year') {
    const start = makeUtcDate(baseYMD.y, 1, 1)
    const s = getYMDFromUtcDate(start)
    return [onFormatDate(formatYMD(s.y, s.m, s.d), format), onFormatDate(todayStr, format)]
  }

  // last year => [去年1/1, 去年12/31]
  if (input === 'last year') {
    const y = baseYMD.y - 1
    return [onFormatDate(formatYMD(y, 1, 1), format), onFormatDate(formatYMD(y, 12, 31), format)]
  }

  // +N/-N + unit (allow "3 month", "-1year", "10 day", "-5 day")
  const m = /^([+-]?\d+)\s*(year|month|day)s?$/i.exec(input)
  if (!m) return null

  const amount = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()

  let result = base
  if (unit === 'day') result = addDays(base, amount)
  if (unit === 'month') result = addMonthsSafe(base, amount)
  if (unit === 'year') result = addYearsSafe(base, amount)

  const r = getYMDFromUtcDate(result)
  return [onFormatDate(formatYMD(r.y, r.m, r.d), format), onFormatDate(todayStr, format)]
}

// 轉換 html tag
export const onReplaceSymbolToTag = (content, symbol, tag) => {
  return content.replace(new RegExp(`\\${symbol}`, 'g'), tag)
}

// 判斷特殊字元長度
export const onUnicodLength = (text) => {
  if (!text) return 0

  const segmenter = new Intl.Segmenter()
  return [...segmenter.segment(String(text))].length
}

// 取得裝置
export const onDevice = () => {
  const angle = globalThis.screen.orientation ? globalThis.screen.orientation.angle : 0
  const PCMinWidth = 1024
  const mobileWidth = 740
  const userAgent = navigator.userAgent
  const isPCPad =
    angle === 0 && globalThis.innerWidth > mobileWidth && globalThis.innerWidth < PCMinWidth // 在桌機時 resize 模擬 Pad 的尺寸
  const isAndroidPad = /Android|webOS|BlackBerry/i.test(userAgent)
  const is16BelowPad = /iPad/i.test(userAgent) // ios 16 以下的系統
  const is17AbovePad = angle !== 0 && /Mac OS X/i.test(userAgent) // iso 17 以上的系統
  const isAndroidMobile = /Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isIPhoneMobile =
    (angle !== 0 && globalThis.innerWidth > 730 && globalThis.innerWidth < 815) ||
    /iPhone/i.test(userAgent)

  if (globalThis.innerWidth <= mobileWidth || isAndroidMobile || isIPhoneMobile) {
    return 'm'
  }
  if (isPCPad || isAndroidPad || is16BelowPad || is17AbovePad) {
    return 't'
  }

  return 'p'
}

// 取得裝置
export const onOS = () => {
  let userAgent = navigator.userAgent.toLocaleLowerCase()
  let osName = null

  switch (true) {
    case /android/.test(userAgent):
      osName = 'Android'
      break
    case /iphone|ipad/.test(userAgent):
      osName = 'IOS'
      break
    default:
      osName = 'Unknown'
      break
  }

  return osName
}

// 取得瀏覽器
export const onBrowser = () => {
  let userAgent = navigator.userAgent.toLocaleLowerCase()
  let browserName = null

  switch (true) {
    case /line/.test(userAgent):
      browserName = 'Line'
      break
    case /fbav/.test(userAgent):
      browserName = 'FaceBook'
      break
    case /chrome|chromium|crios/.test(userAgent):
      browserName = 'Chrome'
      break
    case /firefox|fxios/.test(userAgent):
      browserName = 'Firefox'
      break
    case /safari/.test(userAgent):
      browserName = 'Safari'
      break
    case /opr/.test(userAgent):
      browserName = 'Opera'
      break
    case /edg/.test(userAgent):
      browserName = 'Edge'
      break
    default:
      browserName = 'Unknown'
      break
  }

  return browserName
}

// 產出 uuid
export const onUUID = () => {
  if (typeof crypto === 'object') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
      const callback = (c) => {
        const num = Number(c)
        return (num ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(
          16
        )
      }
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, callback)
    }
  }
  let timestamp = Date.now()
  let perforNow =
    (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let random = Math.random() * 16
    if (timestamp > 0) {
      random = Math.trunc((timestamp + random) % 16)
      timestamp = Math.floor(timestamp / 16)
    } else {
      random = Math.trunc((perforNow + random) % 16)
      perforNow = Math.floor(perforNow / 16)
    }
    return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

// 時間單位對毫秒的換算表
const TIME_UNIT_FACTOR = { ms: 1, s: 1000, m: 60000, h: 3600000 }

// timeFormat.parseToMs 的 number 分支
const parseTimeNumberToMs = (input, numberUnit, autoNumberUnit) => {
  if (!Number.isFinite(input)) return null
  // 常見：< 1e10 可能是秒；但 300 也可能是毫秒，autoNumberUnit 只在可接受「猜測」時開
  if (autoNumberUnit) return input < 1e10 ? input * 1000 : input
  return numberUnit === 's' ? input * 1000 : input
}

// timeFormat.parseToMs 的 string 分支（已 trim、非空）
const parseTimeStringToMs = (raw, numberUnit) => {
  // mm:ss
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [mm, ss] = raw.split(':').map(Number)
    return (mm * 60 + ss) * 1000
  }

  // hh:mm:ss
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(raw)) {
    const [hh, mm, ss] = raw.split(':').map(Number)
    return (hh * 3600 + mm * 60 + ss) * 1000
  }

  // 單位字串：1500ms / 30s / 5m / 2h
  const unitMatch = /^(-?\d+(?:\.\d+)?)\s*(ms|s|m|h)$/i.exec(raw)
  if (unitMatch) {
    const n = Number(unitMatch[1])
    if (!Number.isFinite(n)) return null
    return n * TIME_UNIT_FACTOR[unitMatch[2].toLowerCase()]
  }

  // 純數字字串：'300'
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    return numberUnit === 's' ? n * 1000 : n
  }

  return null
}

// 轉換時間格式
export const timeFormat = {
  /**
   * 把各種 input 轉成「毫秒 ms」
   * 支援：
   * - number：預設視為 ms（也可開 auto 判斷秒/毫秒）
   * - '300'：同上（純數字字串）
   * - '1500ms' / '30s' / '5m' / '2h'
   * - 'mm:ss' 例如 '03:15'
   * - 'hh:mm:ss' 例如 '01:02:03'
   */
  parseToMs(input, props) {
    if (input == null || input === '') return null
    const numberUnit = props?.numberUnit || 'ms'
    const autoNumberUnit = props?.autoNumberUnit || false

    // Date
    if (input instanceof Date) {
      const ms = input.getTime()
      return Number.isFinite(ms) ? ms : null
    }

    // number
    if (typeof input === 'number') {
      return parseTimeNumberToMs(input, numberUnit, autoNumberUnit)
    }

    // string
    if (typeof input !== 'string') return null
    const raw = input.trim()
    if (!raw) return null

    return parseTimeStringToMs(raw, numberUnit)
  },

  /**
   * 把 ms 格式化成字串
   * format:
   * - 'mm:ss'
   * - 'hh:mm:ss'
   *
   * 注意：mm:ss 會顯示「總分鐘」（例如 90 分鐘會顯示 90:00，不會轉成 01:30:00）
   */
  formatMs(ms, format, props) {
    if (ms == null) return ''
    if (!Number.isFinite(ms)) return ''

    const sign = ms < 0 ? '-' : ''
    const absMs = Math.abs(ms)
    const totalSec = Math.floor(absMs / 1000)

    const pad2 = (n) => String(n).padStart(2, '0')
    const decimals = props && Number.isFinite(props.decimals) ? props.decimals : 3

    // 拆成 h/m/s（用於組合輸出）
    const hh = Math.floor(totalSec / 3600)
    // const ss = totalSec % 60

    // ---- 單位輸出（小數/整數）----
    // EX：300s -> 5m -> 0.083h
    if (format === 'hh' || format === 'h') {
      const hours = absMs / 3600000
      // hh / h 都輸出小數，不補零
      return `${sign}${Number(hours.toFixed(decimals)).toString()}`
    }
    if (format === 'mm' || format === 'm') {
      const minutes = absMs / 60000
      // 兩位分鐘（整數、補零）
      if (format === 'mm') return `${sign}${pad2(Math.floor(minutes))}`
      // m：分鐘小數 or 整數
      return `${sign}${Number(minutes.toFixed(decimals)).toString()}`
    }
    if (format === 'ss' || format === 's') {
      const seconds = absMs / 1000
      if (format === 'ss') return `${sign}${pad2(Math.floor(seconds))}`
      return `${sign}${Math.floor(seconds)}`
    }

    // ---- 組合輸出（保留符號，replace h+/m+/s+）----
    const fmt = format || 'mm:ss'
    const hasH = /h+/i.test(fmt)

    // 有 h：m = 分鐘餘數(0-59)；沒 h：m = 總分鐘
    const totalMin = Math.floor(totalSec / 60)
    const minR = Math.floor((totalSec % 3600) / 60)
    const secR = totalSec % 60

    const pick = (token) => {
      const t = token.toLowerCase()
      const len = token.length

      if (t[0] === 'h') {
        const v = hh
        return len >= 2 ? pad2(v) : String(v)
      }

      if (t[0] === 'm') {
        const v = hasH ? minR : totalMin
        return len >= 2 ? pad2(v) : String(v)
      }

      // s
      const v = secR
      return len >= 2 ? pad2(v) : String(v)
    }

    return sign + fmt.replace(/(h+|m+|s+)/gi, (token) => pick(token))
  },

  /**
   * input -> ms -> format
   */
  toTimeString(input, props) {
    const { parseToMs, formatMs } = timeFormat
    const isPropsObject = typeof props === 'object'
    const format = isPropsObject ? props?.format || 'mm:ss' : props || 'mm:ss'
    const parseOptions = (isPropsObject && props?.parseOptions) || {}
    const ms = parseToMs(input, parseOptions)
    if (ms == null) return ''
    return formatMs(ms, format, {
      format,
      parseOptions,
    })
  },
}

// 秒或毫秒的數字 → 毫秒（< 1e12 視為秒，例如 1770262224；>= 1e12 視為毫秒）
const countdownNumberToMs = (n) => (n < 1e12 ? Math.round(n * 1000) : Math.round(n))

// localStorage 只有瀏覽器才有，SSR（Nuxt server / Node）沒有 → 先判斷避免 ReferenceError
const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

// 解析 YYYY[-/.]MM[-/.]DD（可選時間）→ ms（本地時區），失敗回 null
const parseCountdownDateString = (s) => {
  const m =
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,3}))?)?)?)?$/.exec(
      s
    )
  if (!m) return null

  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const hh = Number(m[4] ?? 0)
  const mm = Number(m[5] ?? 0)
  const ss = Number(m[6] ?? 0)
  const ms = m[7] == null ? 0 : Number(String(m[7]).padEnd(3, '0'))

  const t = new Date(year, month, day, hh, mm, ss, ms).getTime() // 本地時區
  return Number.isFinite(t) ? t : null
}

// 倒數計時
export const countdown = {
  _format: 'mm:ss',
  _stopFn: null, // 記錄目前倒數的 stop，讓 onStop 可直接停止
  _doneFn: null, // 記錄目前倒數的 onDone，讓 onStop 也能觸發
  /**
   * 嘗試把各種輸入轉成毫秒時間戳 (ms)
   * 支援：
   * - number：視為 ms（也支援秒，會自動判斷）
   * - numeric string：同上
   * - ISO string：2026-02-05T11:32:45.5052229+08:00
   * - YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
   * - YYYY-MM-DD HH:mm:ss / YYYY/MM/DD HH:mm:ss / YYYY.MM.DD HH:mm:ss
   */
  _parseToMs(input) {
    if (input == null || input === '') return null

    // Date 物件
    if (input instanceof Date) {
      const ms = input.getTime()
      return Number.isFinite(ms) ? ms : null
    }

    // number
    if (typeof input === 'number') {
      return Number.isFinite(input) ? countdownNumberToMs(input) : null
    }

    // string
    const s = String(input).trim()
    if (!s) return null

    // 純數字字串：當作 timestamp（秒或毫秒）
    if (/^\d+$/.test(s)) {
      const n = Number(s)
      return Number.isFinite(n) ? countdownNumberToMs(n) : null
    }

    // 先試原生 Date.parse（ISO / RFC 等大多吃得到）
    const parsed = Date.parse(s)
    if (Number.isFinite(parsed)) return parsed

    // 自己處理：YYYY[-/.]MM[-/.]DD (可選時間)
    // 例：2026-02-05、2026/02/05 13:05:09、2026.02.05 00:00:00
    return parseCountdownDateString(s)
  },
  /**
   * expireTime 的單位容錯：
   * - 傳 30 / "30" -> 當作「秒」
   * - 傳 30000 / "30000" -> 當作「毫秒」
   * - 也可以直接傳 "30s" / "5m" / "2h" / "1d"
   */
  _parseDurationToMs(expireTime) {
    if (expireTime == null || expireTime === '') return null

    // number
    if (typeof expireTime === 'number') {
      if (!Number.isFinite(expireTime)) return null
      // 小於 1e12 不可能是時間戳，這裡只判斷秒/毫秒
      // 小於 1e6(約 16 分鐘) 通常是秒；更大多半是毫秒
      return expireTime < 1e6 ? Math.round(expireTime * 1000) : Math.round(expireTime)
    }

    const s = String(expireTime).trim()
    if (!s) return null

    // 形如 "30s" / "5m" / "2h" / "1d"
    const unit = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i.exec(s)
    if (unit) {
      const n = Number(unit[1])
      const u = unit[2].toLowerCase()
      if (!Number.isFinite(n)) return null
      const map = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 }
      return Math.round(n * map[u])
    }

    // 純數字字串：同 number 規則
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = Number(s)
      if (!Number.isFinite(n)) return null
      return n < 1e6 ? Math.round(n * 1000) : Math.round(n)
    }

    return null
  },
  _formatTime(remainingMs, format) {
    const pad2 = (n) => String(n).padStart(2, '0')
    const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))

    if (format === 'sss') return String(totalSec)

    const hh = Math.floor(totalSec / 3600)
    const mm = Math.floor((totalSec % 3600) / 60)
    const ss = totalSec % 60

    if (format === 'hh:mm:ss') {
      return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
    }

    // 'mm:ss'：分鐘可超過 59（例如 90 分鐘會顯示 90:00）
    const totalMin = Math.floor(totalSec / 60)
    return `${totalMin}:${pad2(ss)}`
  },
  /**
   * - 傳入 remainingMs（剩餘毫秒）
   */
  _createCountdownTicker({ remainingMs, format, onTick, onDone }) {
    const { _formatTime } = countdown
    const initialMs = Number(remainingMs)
    if (!Number.isFinite(initialMs) || initialMs < 0) {
      throw new Error('createCountdownTicker: remainingMs must be a finite number >= 0')
    }

    const expireMs = Date.now() + initialMs

    let rafId = 0
    let stopped = false
    let lastSec = null
    let doneCalled = false

    const stop = () => {
      stopped = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    }

    const loop = () => {
      if (stopped) return

      const now = Date.now()
      const leftMs = Math.max(0, expireMs - now)
      const leftSec = Math.max(0, Math.ceil(leftMs / 1000))
      const isExpired = leftMs <= 0

      // 每秒只更新一次
      if (lastSec !== leftSec) {
        lastSec = leftSec

        onTick?.({
          remainingMs: leftMs,
          remainingSec: leftSec,
          value: _formatTime(leftMs, format),
          format,
          isExpired,
        })
      }

      // onTick 可能會觸發外部呼叫 onStop()，再檢查一次
      if (stopped) return

      if (isExpired) {
        stop()
        if (!doneCalled) {
          doneCalled = true
          onDone?.()
        }
        return
      }

      // stopped 確認後才排下一個 frame
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return { stop }
  },

  /**
   * 存 countdown
   * @param {*} startTime - 任何時間格式（ISO / Date / YYYY-MM-DD / timestamp）；無值就 new Date()
   * @param {*} expireTime - 兩種都吃：
   *   1. 絕對到期時間點（任何時間格式）-> 自動換算成 expireTime - startTime
   *   2. duration（秒/毫秒/或帶單位字串，例如 30 / "5m"）-> 到期時間 = start + duration
   * @param {string} format - 'hh:mm:ss' | 'mm:ss' | 'sss'
   * @param {string} storageName - localStorage key
   * @param {function} onTick - 每秒計算回傳的時間
   * @param {function} onDone - 時間到的事件
   */
  onStart({ startTime, expireTime, format, storageName, onTick, onDone }) {
    const { _format, _parseToMs, _parseDurationToMs, _formatTime, _createCountdownTicker, onStop } =
      countdown
    const startMs = startTime ? _parseToMs(startTime) : Date.now()
    if (!Number.isFinite(startMs)) throw new Error('onStart: invalid startTime')

    // expireTime 可帶「絕對到期時間點」或「duration」
    // 先試絕對時間：能解析成比 startMs 還晚的時間點 -> 視為到期時間，自動相減
    const absMs = _parseToMs(expireTime)
    const durationMs =
      Number.isFinite(absMs) && absMs > startMs ? absMs - startMs : _parseDurationToMs(expireTime)
    if (!Number.isFinite(durationMs)) throw new Error('onStart: invalid expireTime')

    const expireMs = startMs + durationMs

    const payload = {
      startMs,
      expireMs,
      durationMs,
      createdAtMs: Date.now(),
      v: 1,
    }

    const hasStorage =
      canUseStorage() && typeof storageName === 'string' && storageName.trim() !== ''
    const key = hasStorage ? storageName.trim() : ''

    if (hasStorage) {
      localStorage.setItem(key, JSON.stringify(payload))
    }

    const remainingMs = Math.max(0, expireMs - Date.now())
    const formatText = _formatTime(remainingMs, format || _format)

    onStop({
      invokeDone: false,
    })

    // 先存起來，讓 countdown.onStop() 也能觸發
    countdown._doneFn = () => {
      // done 時也把 stop 清掉
      countdown._stopFn = null
      countdown._doneFn = null

      if (hasStorage) localStorage.removeItem(key)
      onDone?.()
    }

    const ticker = _createCountdownTicker({
      remainingMs,
      format,
      onTick,
      onDone: () => {
        // 讓 ticker 自己到期時也走同一套 done（避免重複寫邏輯）
        countdown.onStop({
          invokeDone: true,
        })
      },
    })

    // 存起來給 onStop 用
    countdown._stopFn = ticker.stop

    return {
      data: payload,
      remainingMs,
      remainingSec: Math.ceil(remainingMs / 1000),
      formatText,
      isExpired: remainingMs <= 0,
      stop: ticker.stop,
    }
  },
  /**
   * 停止目前倒數（取消 requestAnimationFrame）
   * - 預設會同時觸發 onDone（你要求的行為）
   * @param {Object} opts
   * @param {boolean} [opts.invokeDone = true] - 是否要觸發 done
   */
  onStop(opts) {
    const { invokeDone } = opts || {}
    const { _stopFn, _doneFn } = countdown

    // 先清掉引用，避免重入 / 重複呼叫
    countdown._stopFn = null
    countdown._doneFn = null

    if (typeof _stopFn === 'function') _stopFn()
    if (invokeDone !== false && typeof _doneFn === 'function') _doneFn()
  },
  /**
   * 取 countdown 剩餘時間
   * @param {string} storageName - localStorage key
   */
  onGet(storageName) {
    if (!storageName) throw new Error('onGet: storageName is required')

    // SSR 沒有 localStorage，直接當作查無資料回傳
    if (!canUseStorage()) {
      return {
        ok: false,
        reason: 'NO_STORAGE',
        remainingMs: 0,
        remainingSec: 0,
        isExpired: true,
        data: null,
      }
    }

    const raw = localStorage.getItem(storageName)
    if (!raw) {
      return {
        ok: false,
        reason: 'NOT_FOUND',
        remainingMs: 0,
        remainingSec: 0,
        isExpired: true,
        data: null,
      }
    }

    let data = null
    try {
      data = JSON.parse(raw)
    } catch {
      // 壞資料直接清掉
      localStorage.removeItem(storageName)
      return {
        ok: false,
        reason: 'BAD_JSON',
        remainingMs: 0,
        remainingSec: 0,
        isExpired: true,
        data: null,
      }
    }

    const expireMs = Number(data?.expireMs)
    const startMs = Number(data?.startMs)

    if (!Number.isFinite(expireMs) || !Number.isFinite(startMs)) {
      localStorage.removeItem(storageName)
      return {
        ok: false,
        reason: 'BAD_DATA',
        remainingMs: 0,
        remainingSec: 0,
        isExpired: true,
        data: null,
      }
    }

    const now = Date.now()
    const remainingMs = Math.max(0, expireMs - now)
    const isExpired = now >= expireMs

    // 過期就清掉
    if (isExpired) localStorage.removeItem(storageName)

    return {
      ok: true,
      remainingMs,
      remainingSec: Math.ceil(remainingMs / 1000),
      isExpired,
      data,
    }
  },
}

// 取得 YouTube 縮圖
export const onGetYouTubeID = (url) => {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const match = url.match(regex)
  return match ? match[1] : null
}

// 鎖住 body scrollbar
export const onBodyOverflowHiddenToggle = (status) => {
  const body = document.body
  const classHidden = 'overflow-hidden'

  if (status) {
    body.classList.add(classHidden)
  } else {
    body.classList.remove(classHidden)
  }
}

/**
 * 取得 location.search 的 key 值
 * - key 傳入 query 的 key
 */
export const onQueryParam = (key) => {
  if (!key) return null
  const { search } = globalThis.location
  const params = new URLSearchParams(search)
  return params.get(key)
}

// 驗證錯誤時取第一個錯誤的 elem 位置
export const onFormErrorScrollToElem = (errors, options = {}) => {
  const { offset = 10, behavior = 'smooth' } = options
  const names = Object.keys(errors || {})

  if (!names.length || typeof document === 'undefined' || typeof window === 'undefined') return

  const escapeSelector = (value) => {
    return window.CSS && typeof window.CSS.escape === 'function'
      ? window.CSS.escape(value)
      : String(value).replace(/["\\]/g, '\\$&')
  }

  const getHiddenTarget = (elem) => {
    const form = elem.closest('.m-form')

    return (
      elem.previousElementSibling ||
      elem.parentElement?.previousElementSibling ||
      form?.previousElementSibling ||
      form ||
      elem.nextElementSibling ||
      elem
    )
  }

  const getScrollTarget = (name) => {
    const safeName = escapeSelector(name)
    const elem = document.querySelector(`[name="${safeName}"], #${safeName}`)

    if (!elem) return null

    const isHidden = elem.type === 'hidden' || elem.hidden
    const target = isHidden ? getHiddenTarget(elem) : elem

    return target.closest?.('.m-form') || target
  }

  requestAnimationFrame(() => {
    const targets = names
      .map((name) => getScrollTarget(name))
      .filter(Boolean)
      .sort((a, b) => {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top
      })

    const target = targets[0]

    if (!target) return

    const top = target.getBoundingClientRect().top + window.scrollY - offset

    window.scrollTo({
      top,
      behavior,
    })
  })
}

// 同時執行多支 api，會等全部回傳
export const awaitAllPromise = async (apis) => {
  try {
    await Promise.all(apis)
  } catch (error) {
    console.log(error)
  }
}
