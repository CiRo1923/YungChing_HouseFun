/* 時間的解析與格式化。欄位有哪些、能不能選,**完全由 config.format 決定**:

    hh:mm:ss   時 / 分 / 秒 都可選
    hh:mm      時 / 分 可選
    hh         只有時可選
    hh:00:00   只有時可選,但輸出補 :00:00
    hh:mm:00   時 / 分 可選,輸出補 :00

  規則:format 裡寫成 token(hh / mm / ss)的欄位可選,寫成數字字面(00)的欄位
  不可選、輸出時照抄那個字面。所以「要不要出現這一欄」與「要不要能改」是同一件事的兩面,
  呼叫端只要改 format,不必再多開一個開關。

  ⚠️ 一律當 24 小時制 —— 後台不做 AM/PM,hh 與 HH 都吃,語意相同。 */

const DEFAULT_FORMAT = 'hh:mm:ss'

// format 裡認得的 token → 內部欄位名
const TOKENS = [
  { regex: /^(?:hh|HH)$/, type: 'hour', max: 23 },
  { regex: /^mm$/, type: 'minute', max: 59 },
  { regex: /^ss$/, type: 'second', max: 59 },
]

export const onPad2 = (n) => String(n).padStart(2, '0')

/* 把 format 拆成一段一段。回傳的 parts 順序就是畫面上欄位的順序,
  editable 的才會變成可以選的滾動欄。 */
export const onParseTimeFormat = (format) => {
  const raw = String(format || DEFAULT_FORMAT).trim()
  const sep = raw.match(/[^\w]/)?.[0] ?? ':'
  const parts = []

  for (const segment of raw.split(/[^\w]+/).filter(Boolean)) {
    const token = TOKENS.find((item) => item.regex.test(segment))

    if (token) {
      parts.push({ type: token.type, max: token.max, editable: true })
      continue
    }

    // 數字字面(00):固定值,不可選但要輸出
    if (/^\d+$/.test(segment)) {
      parts.push({ type: 'fixed', value: segment, editable: false })
    }
  }

  return { sep, parts: parts.length ? parts : onParseTimeFormat(DEFAULT_FORMAT).parts }
}

// 目前 format 底下,某個欄位是不是可以選的
export const onHasPart = (format, type) =>
  onParseTimeFormat(format).parts.some((part) => part.editable && part.type === type)

/* 把值解析成 { hour, minute, second }。
  ⚠️ 不依 format 的位置去切 —— 呼叫端存進來的值不一定跟 format 同一種精度
      (format 是 hh:mm,值卻是 09:30:00 很常見),照位置切會把秒讀成分。
      統一用「冒號分段」讀,缺的補 0。 */
export const onParseTime = (value) => {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return { hour: value.getHours(), minute: value.getMinutes(), second: value.getSeconds() }
  }

  const matched = String(value)
    .trim()
    .match(/(\d{1,2})(?:\D+(\d{1,2}))?(?:\D+(\d{1,2}))?/)
  if (!matched) return null

  const onSafe = (raw, max) => {
    const n = parseInt(raw ?? '0', 10)

    return Number.isNaN(n) ? 0 : Math.min(Math.max(n, 0), max)
  }

  return {
    hour: onSafe(matched[1], 23),
    minute: onSafe(matched[2], 59),
    second: onSafe(matched[3], 59),
  }
}

// 依 format 組回字串。可選欄填值,固定欄照抄字面
export const onFormatTime = (time, format) => {
  if (!time) return ''

  const { sep, parts } = onParseTimeFormat(format)

  return parts.map((part) => (part.editable ? onPad2(time[part.type] ?? 0) : part.value)).join(sep)
}

/* 產生某一欄的可選清單。step 由 config.step 給(預設 1),
  例:{ minute: 15 } → 00 / 15 / 30 / 45 */
export const onGetTimeOptions = (type, step = 1) => {
  const max = TOKENS.find((token) => token.type === type)?.max ?? 59
  const size = Math.max(1, Number(step) || 1)
  const options = []

  for (let value = 0; value <= max; value += size) {
    options.push({ key: value, value: onPad2(value) })
  }

  return options
}

/* 值超出 min / max 就夾回範圍內。min / max 同樣吃 'hh:mm:ss' 字串,
  比較時一律換算成當天的秒數。 */
export const onTimeSeconds = (time) =>
  time ? time.hour * 3600 + time.minute * 60 + time.second : null

export const onIsTimeDisabled = (time, { minTime, maxTime } = {}) => {
  const seconds = onTimeSeconds(time)
  if (seconds == null) return false

  const min = onTimeSeconds(onParseTime(minTime))
  const max = onTimeSeconds(onParseTime(maxTime))

  return !!((min != null && seconds < min) || (max != null && seconds > max))
}
