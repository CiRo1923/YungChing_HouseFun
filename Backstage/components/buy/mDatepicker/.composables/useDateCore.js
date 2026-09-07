/* 日期的解析與格式化。純函式,不持有任何 Vue 狀態 —— Single / Time / Calendar 共用。

  ⚠️ 一律避開 new Date('YYYY-MM-DD'):那會被當成 UTC 解析,在台灣時區會退成前一天,
      iOS Safari 更是直接給 Invalid Date。內部解析固定用本地時間中午 12:00,
      日期比較時再轉成 00:00:00。 */

import { onParseTimeFormat } from './useTimeCore.js'

const DEFAULT_FORMAT = 'YYYY-MM-DD'

export const onPad2 = (n) => String(n).padStart(2, '0')

// 從 format 取出分隔符(YYYY/MM/DD → '/'),取不到就用 '-'
export const onGetFormatSep = (fmt) => {
  const matched = String(fmt || '').match(/\W/)

  return matched ? matched[0] : '-'
}

export const onParseTimeFromString = (value) => {
  const matched = String(value || '').match(/(\d{2}):(\d{2}):(\d{2})/)
  if (!matched) return null

  return {
    hh: parseInt(matched[1], 10),
    mm: parseInt(matched[2], 10),
    ss: parseInt(matched[3], 10),
  }
}

// 沒有時間時固定用 12:00,避免時區造成日期前後偏移
export const onSafeDateFromYMD = (y, mo, d, timeObj) => {
  const hasTime = !!timeObj
  const date = new Date(
    y,
    mo - 1,
    d,
    hasTime ? timeObj.hh : 12,
    hasTime ? timeObj.mm : 0,
    hasTime ? timeObj.ss : 0,
    0
  )

  return isNaN(date.getTime()) ? null : date
}

/* 吃得下 Date / timestamp / .NET 的 /Date(…)/ / YYYYMMDD / YYYY-MM-DD(可帶時間)。
  都不符合才落到 Date fallback,並先把 - 換成 / 降低 iOS 解析問題。 */
export const onParseDate = (input) => {
  if (input == null || input === '') return null

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null

    return onSafeDateFromYMD(input.getFullYear(), input.getMonth() + 1, input.getDate())
  }

  if (typeof input === 'number') {
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return null

    return onSafeDateFromYMD(date.getFullYear(), date.getMonth() + 1, date.getDate())
  }

  const raw = String(input).trim()
  if (!raw) return null

  // .NET: /Date(1690000000000+0800)/
  if (/^\/Date/.test(raw)) {
    const matched = raw.match(/\((\d+)(?:[-+]\d+)?\)/)
    if (!matched) return null

    const date = new Date(Number(matched[1]))
    if (Number.isNaN(date.getTime())) return null

    return onSafeDateFromYMD(date.getFullYear(), date.getMonth() + 1, date.getDate())
  }

  const value = raw.replace(/T/, ' ').trim()
  const timeObj = onParseTimeFromString(value)

  // YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    return onSafeDateFromYMD(
      parseInt(value.slice(0, 4), 10),
      parseInt(value.slice(4, 6), 10),
      parseInt(value.slice(6, 8), 10),
      timeObj
    )
  }

  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD,可含時間
  const matched = value.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\s+\d{2}:\d{2}:\d{2})?$/)
  if (matched) {
    return onSafeDateFromYMD(
      parseInt(matched[1], 10),
      parseInt(matched[2], 10),
      parseInt(matched[3], 10),
      timeObj
    )
  }

  const fallback = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(fallback.getTime())) return null

  return onSafeDateFromYMD(
    fallback.getFullYear(),
    fallback.getMonth() + 1,
    fallback.getDate(),
    timeObj
  )
}

// 日期比較一律轉成 00:00:00 再比,免得時分秒影響大小
export const onDateOnlyMs = (value) => {
  const date = onParseDate(value)
  if (!date) return null

  const ms = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime()

  return Number.isNaN(ms) ? null : ms
}

export const onGetYMD = (value) => {
  const date = onParseDate(value)
  if (!date) return null

  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), date }
}

/* config.format 可以是字串,也可以是 { model, datePicker } —— 前者是回傳給呼叫端的格式,
  後者是輸入框顯示的格式。兩者可以不同(例:model 存 YYYYMMDD、畫面顯示 YYYY/MM/DD)。 */
export const onNormalizeFormat = (format) => {
  if (format && typeof format === 'object') {
    return {
      model: format.model || DEFAULT_FORMAT,
      datePicker: format.datePicker || format.model || DEFAULT_FORMAT,
    }
  }

  return {
    model: format || DEFAULT_FORMAT,
    datePicker: format || DEFAULT_FORMAT,
  }
}

export const onPickFormat = (format, type = 'datePicker') => {
  if (format && typeof format === 'object') {
    return String(format[type] || format.datePicker || format.model || DEFAULT_FORMAT).trim()
  }

  return String(format || DEFAULT_FORMAT).trim()
}

/* format 同時決定「選到哪一層」與「有沒有時間」—— 與時間端同一套想法:
    寫在 format 裡的段落才選得到,沒寫的就不出現。

      YYYY                 只選年
      YYYY-MM              年 / 月
      YYYY-MM-DD           年 / 月 / 日
      YYYY-MM-DD hh        年月日 + 時
      YYYY-MM-DD hh:mm     年月日 + 時分
      YYYY-MM-DD hh:mm:00  年月日 + 時分(秒補 00)

  日期與時間以空白分隔,時間那半原封不動交給 useTimeCore 處理
  (它自己會依 hh / mm / ss 與數字字面決定欄位),這裡不重複解析。 */
export const onSplitDateTimeFormat = (format) => {
  const segments = String(format || DEFAULT_FORMAT)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  /* ⚠️ 用「特徵」找段落,不要靠位置(segments[0] 是日期、[1] 是時間)——
      只給時間段的 format 會被誤判成日期,順序反過來寫也會錯。

      日期段認大寫 Y / M / D,時間段認小寫 hh / mm / ss 或帶冒號的字面值,
      所以 'YYYY-MM-DD' 的 MM 不會被當成分鐘。 */
  const date = segments.find((segment) => /[YMD]/.test(segment)) ?? ''
  const time = segments.find((segment) => /hh|HH|mm|ss/.test(segment) || /:/.test(segment)) ?? ''

  return { date: date || DEFAULT_FORMAT, time }
}

/* 日期的精度 —— 'year' | 'month' | 'day'。
  有 D 就到日、只有 M 就到月、都沒有就只有年。 */
export const onGetDatePrecision = (format) => {
  const { date } = onSplitDateTimeFormat(format)

  if (/D/.test(date)) return 'day'
  if (/M/.test(date)) return 'month'

  return 'year'
}

/* format 有沒有「可以選」的時間欄位 —— 決定要不要並排那個時間輸入框。
  ⚠️ 不是看有沒有時間段:'YYYY-MM-DD 00:00:00' 有時間段,但三欄都是數字字面值,
      意思是「不給選時間,可是值要帶滿 00:00:00」—— 那時不該長出時間欄。
      判斷交給 useTimeCore,它本來就負責「哪幾欄可選」。 */
export const onHasTimeFormat = (format) => {
  const time = onSplitDateTimeFormat(format).time

  if (!time) return false

  return onParseTimeFormat(time).parts.some((part) => part.editable)
}

// 依 format 組出日期字串;分隔符統一換成 format 自己用的那個
export const onFormatYMD = (y, m, d, format) => {
  const sep = onGetFormatSep(format)

  return String(format)
    .replace(/YYYY/g, String(y))
    .replace(/MM/g, onPad2(m))
    .replace(/DD/g, onPad2(d))
    .replace(/[-/.]/g, sep)
}

/* 依 format 反解:先把兩邊的非文數字都去掉,再用 format 裡 Y/M/D 的**位置**去切值。
  這樣 20260819 與 2026-08-19 都吃得下,不必為每種分隔符寫一條正則。

  ⚠️ format 只到年或只到月時(YYYY / YYYY-MM),缺的那幾段補 1 ——
      Date 需要完整的年月日才建得起來,少一段會得到 Invalid Date。
      補 1 而不是補「今天」:同一個值不該因為今天是幾號而解析出不同結果。 */
export const onParseByFormat = (value, format) => {
  if (value instanceof Date || typeof value === 'number') return onParseDate(value)
  if (value == null || value === '') return null

  // 時間那半交給 useTimeCore,這裡只看日期段
  const { date: dateFormat } = onSplitDateTimeFormat(onPickFormat(format))
  const formatValue = String(dateFormat).replace(/\W/g, '')
  const dateValue = String(value).replace(/\W/g, '')
  if (dateValue.length < formatValue.length) return null

  const onGetPart = (regex, fallback) => {
    const matched = new RegExp(regex).exec(formatValue)
    if (!matched) return fallback

    const parsed = parseInt(
      dateValue.substring(matched.index, matched.index + matched[0].length),
      10
    )

    return Number.isNaN(parsed) ? fallback : parsed
  }

  return onSafeDateFromYMD(onGetPart(/Y+/, NaN), onGetPart(/M+/, 1), onGetPart(/D+/, 1))
}

export const onGetYMDByFormat = (value, format) => {
  const date = onParseByFormat(value, format) || onParseDate(value)
  if (!date) return null

  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), date }
}

// 安全加減月份 —— 直接 setMonth 會讓 1/31 加一個月變成 3/2
export const onAddMonthsSafe = (dateObj, months) => {
  const targetMonthIndex = dateObj.getMonth() + months
  const targetYear = dateObj.getFullYear() + Math.floor(targetMonthIndex / 12)
  const modMonth = ((targetMonthIndex % 12) + 12) % 12
  const maxDay = new Date(targetYear, modMonth + 1, 0).getDate()

  return new Date(targetYear, modMonth, Math.min(dateObj.getDate(), maxDay), 12, 0, 0, 0)
}

export const onGetClientToday = () => {
  const now = new Date()

  return onSafeDateFromYMD(now.getFullYear(), now.getMonth() + 1, now.getDate())
}
