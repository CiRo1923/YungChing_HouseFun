<script setup>
import '@js/_validation.js'
import { onAddZero } from '@js/_prototype.js'

import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

import { Field, ErrorMessage } from 'vee-validate'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits([
  'update:modelValue',
  'selected',
  'focusin',
  'focusout',
  'input',
  'keydown.enter',
])

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Date, Number, null],
    default: '',
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  rules: {
    type: [String, Object],
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const weekLabels = {
  ch: [
    { key: 0, value: '日' },
    { key: 1, value: '一' },
    { key: 2, value: '二' },
    { key: 3, value: '三' },
    { key: 4, value: '四' },
    { key: 5, value: '五' },
    { key: 6, value: '六' },
  ],
  en: [
    { key: 0, value: 'Sun' },
    { key: 1, value: 'Mon' },
    { key: 2, value: 'Tue' },
    { key: 3, value: 'Wed' },
    { key: 4, value: 'Thu' },
    { key: 5, value: 'Fri' },
    { key: 6, value: 'Sat' },
  ],
}

const datePickerContainerRef = ref(null)
const datePickerIconRef = ref(null)
const datePickerCalendarRef = ref(null)

const isFocus = ref(false)
const isActive = ref(null)
const isDeviceM = computed(() => device.value === 'm')

const onNormalizeFormat = (format) => {
  const defaultFormat = 'YYYY-MM-DD'

  if (format && typeof format === 'object') {
    return {
      model: format.model || defaultFormat,
      datePicker: format.datePicker || format.model || defaultFormat,
    }
  }

  return {
    model: format || defaultFormat,
    datePicker: format || defaultFormat,
  }
}

const config = computed(() => {
  const propsConfig = props.config || {}
  const format = onNormalizeFormat(propsConfig.format)

  return {
    altInput: false,
    mobileSupport: true,
    maximumYear: 0, // 可往後顯示的年份數
    days: 42, // 42 或 auto；auto 會依月份週數顯示
    lang: 'ch',
    position: 'auto',
    format,
    headerMode: 'string', // 日立切換年 / 月的模式 'string' | 'select'
    weeks: weekLabels,
    showOverDate: true, // 是否顯示超出 min/max 的日期
    defaultIsToday: true,
    today: null,
    maxDate: '',
    minDate: '',
    length: null,
    placeholder: null,
    ...propsConfig,
    format,
  }
})

/**
 * ---- date helpers ----
 * 避免直接使用 new Date('YYYY-MM-DD') 造成 iOS 或時區誤差。
 * 內部解析日期時固定使用本地時間中午，日期比較時再轉成 00:00:00。
 */
const onPad2 = (n) => String(n).padStart(2, '0')

const onGetFormatSep = (fmt) => {
  const m = String(fmt || '').match(/\W/)
  return m ? m[0] : '-'
}

const onParseTimeFromString = (s) => {
  const m = String(s || '').match(/(\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  return {
    hh: parseInt(m[1], 10),
    mm: parseInt(m[2], 10),
    ss: parseInt(m[3], 10),
  }
}

const onSafeDateFromYMD = (y, mo, d, timeObj) => {
  // 沒有時間時固定用 12:00，避免時區造成日期前後偏移。
  const hasTime = !!timeObj
  const H = hasTime ? timeObj.hh : 12
  const M = hasTime ? timeObj.mm : 0
  const S = hasTime ? timeObj.ss : 0
  const dt = new Date(y, mo - 1, d, H, M, S, 0)
  return isNaN(dt.getTime()) ? null : dt
}

const onParseDate = (input) => {
  if (input == null || input === '') return null

  if (input instanceof Date) {
    const ms = input.getTime()
    if (Number.isNaN(ms)) return null
    return onSafeDateFromYMD(input.getFullYear(), input.getMonth() + 1, input.getDate())
  }

  // number (timestamp)
  if (typeof input === 'number') {
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return null
    return onSafeDateFromYMD(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  const s0 = String(input).trim()
  if (!s0) return null

  // .NET: /Date(1690000000000+0800)/
  if (/^\/Date/.test(s0)) {
    const m = s0.match(/\((\d+)(?:[-+]\d+)?\)/)
    if (!m) return null
    const d = new Date(Number(m[1]))
    if (Number.isNaN(d.getTime())) return null
    return onSafeDateFromYMD(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  const s = s0.replace(/T/, ' ').trim()
  const timeObj = onParseTimeFromString(s)

  // YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const y = parseInt(s.slice(0, 4), 10)
    const mo = parseInt(s.slice(4, 6), 10)
    const d = parseInt(s.slice(6, 8), 10)
    return onSafeDateFromYMD(y, mo, d, timeObj)
  }

  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD，可含時間。
  {
    const m = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\s+\d{2}:\d{2}:\d{2})?$/)
    if (m) {
      const y = parseInt(m[1], 10)
      const mo = parseInt(m[2], 10)
      const d = parseInt(m[3], 10)
      return onSafeDateFromYMD(y, mo, d, timeObj)
    }
  }

  // 最後才使用 Date fallback，並先把 - 換成 / 降低 iOS 解析問題。
  const fallback = new Date(s.replace(/-/g, '/'))
  if (Number.isNaN(fallback.getTime())) return null
  return onSafeDateFromYMD(
    fallback.getFullYear(),
    fallback.getMonth() + 1,
    fallback.getDate(),
    timeObj
  )
}

const onDateOnlyMs = (v) => {
  const d = onParseDate(v)
  if (!d) return null
  // 日期比較一律轉成 00:00:00。
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const ms = dt.getTime()
  return Number.isNaN(ms) ? null : ms
}

const onConfigFormat = (type = 'datePicker') => {
  const format = config.value.format

  if (format && typeof format === 'object') {
    return String(format[type] || format.datePicker || format.model || 'YYYY-MM-DD').trim()
  }

  return String(format || 'YYYY-MM-DD').trim()
}

const onFormatConfig = (y, m, d, type = 'datePicker') => {
  // 依 config.format 組出 model 或 datePicker 使用的日期字串。
  const fmt = onConfigFormat(type)
  const sep = onGetFormatSep(fmt)

  const YYYY = String(y)
  const MM = onPad2(m)
  const DD = onPad2(d)

  return fmt.replace(/YYYY/g, YYYY).replace(/MM/g, MM).replace(/DD/g, DD).replace(/[-/.]/g, sep)
}

const onGetYMD = (v) => {
  const d = onParseDate(v)
  if (!d) return null
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), date: d }
}

const onParseDateByConfig = (value, type = 'model') => {
  if (value instanceof Date || typeof value === 'number') return onParseDate(value)
  if (value == null || value === '') return null

  const formatValue = onConfigFormat(type).replace(/\W/g, '')
  const dateValue = String(value).replace(/\W/g, '')
  if (dateValue.length < formatValue.length) return null

  const onGetPart = (regex) => {
    const matched = new RegExp(regex).exec(formatValue)
    if (!matched) return ''

    const firstIndex = matched.index
    const lastIndex = matched.index + matched[0].length
    return dateValue.substring(firstIndex, lastIndex)
  }

  const y = parseInt(onGetPart(/Y+/), 10)
  const m = parseInt(onGetPart(/M+/), 10)
  const d = parseInt(onGetPart(/D+/), 10)

  return onSafeDateFromYMD(y, m, d)
}

const onGetYMDByConfig = (value, type = 'model') => {
  const d = onParseDateByConfig(value, type) || onParseDate(value)
  if (!d) return null
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), date: d }
}

const onAddMonthsSafe = (dateObj, months) => {
  const d0 = new Date(dateObj.getTime())
  const y = d0.getFullYear()
  const m = d0.getMonth()
  const day = d0.getDate()

  const targetMonthIndex = m + months
  const targetYear = y + Math.floor(targetMonthIndex / 12)
  const modMonth = ((targetMonthIndex % 12) + 12) % 12

  const maxDay = new Date(targetYear, modMonth + 1, 0).getDate()
  const nextDay = Math.min(day, maxDay)

  // 固定用 12:00，避免時區造成日期前後偏移。
  return new Date(targetYear, modMonth, nextDay, 12, 0, 0, 0)
}

/**
 * ---- max/min date ----
 * 超過 maxDate 或早於 minDate 的日期會 disabled。
 */
const onDateDisabled = (dateStr) => {
  const dateMs = onDateOnlyMs(dateStr)

  const maxMs =
    config.value.maxDate !== '' && config.value.maxDate != null
      ? onDateOnlyMs(config.value.maxDate)
      : null

  const minMs =
    config.value.minDate !== '' && config.value.minDate != null
      ? onDateOnlyMs(config.value.minDate)
      : null

  if (dateMs == null) return false

  return !!((maxMs != null && dateMs > maxMs) || (minMs != null && dateMs < minMs))
}

const allowedSep = computed(() => onGetFormatSep(onConfigFormat('datePicker')))

const onGetClientTodayDate = () =>
  onSafeDateFromYMD(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

const todayDate = computed(() => {
  // 若外部有指定 today，就優先使用；無效時改用 client 今天。
  if (config.value.today != null && config.value.today !== '') {
    return onParseDate(config.value.today) || onGetClientTodayDate()
  }

  return onGetClientTodayDate()
})

const today = computed(() => {
  const ymd = onGetYMD(todayDate.value)
  return ymd ? onFormatConfig(ymd.y, ymd.m, ymd.d, 'datePicker') : ''
})

const todayModel = computed(() => {
  const ymd = onGetYMD(todayDate.value)
  return ymd ? onFormatConfig(ymd.y, ymd.m, ymd.d, 'model') : ''
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emits('update:modelValue', newValue)
  },
})

const onGetInputValue = (value) => {
  if (value?.target) return value.target.value
  if (value == null) return ''
  if (value instanceof Date) return value

  return typeof value === 'string' || typeof value === 'number' ? value : ''
}

const datePickerModel = computed({
  get() {
    const ymd = onGetYMDByConfig(model.value, 'model')
    if (ymd) return onFormatConfig(ymd.y, ymd.m, ymd.d, 'datePicker')

    if (model.value == null) {
      return config.value.defaultIsToday ? today.value : ''
    }

    return onGetInputValue(model.value)
  },
  set(newValue) {
    const value = onGetInputValue(newValue)
    const ymd = onGetYMDByConfig(value, 'datePicker')
    model.value = ymd ? onFormatConfig(ymd.y, ymd.m, ymd.d, 'model') : value
  },
})

const isDatePickerPopup = computed(() => isDeviceM.value && config.value.mobileSupport)
const inputType = computed(() => (isDeviceM.value && !config.value.mobileSupport ? 'date' : 'tel'))

const currDate = ref(null)
const formatDate = ref(null)
const currDateValue = ref(null)
const currYear = ref(null)
const currMonth = ref(null)

const onGetYearLabels = () => {
  const year = []
  const maxDate = config.value.today || config.value.maxDate
  const maxYear =
    maxDate && !config.value.showOverDate
      ? (onGetYMDByConfig(maxDate)?.y ?? new Date().getFullYear())
      : new Date().getFullYear()
  const minYear =
    config.value.minDate && !config.value.showOverDate
      ? onGetYMDByConfig(config.value.minDate)?.y || 1911
      : 1911

  for (let i = maxYear + config.value.maximumYear; i >= minYear; i--) {
    year.push({ key: i, value: i })
  }

  return year
}

const monthLabels = {
  ch: [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

const months = computed(() => {
  const maxDateValue =
    typeof config.value.maxDate === 'object' ? +config.value.maxDate : config.value.maxDate

  const curr = onGetYMD(currDateValue.value)
  const max = onGetYMD(maxDateValue)

  const maxMonth =
    config.value.maxDate && curr && max && curr.y === max.y && !config.value.showOverDate
      ? max.date.getMonth() + 1
      : monthLabels[config.value.lang].length

  const list = []
  for (let i = 0; i < maxMonth; i += 1) {
    list.push(monthLabels[config.value.lang][i])
  }
  return list
})

const onNormalizeWeeks = () => {
  const source = config.value.weeks?.[config.value.lang] || config.value.weeks || weekLabels.ch
  const list = Array.isArray(source) ? source : weekLabels.ch
  const defaultList = weekLabels[config.value.lang] || weekLabels.ch

  return list.map((item, index) => {
    if (typeof item === 'object') {
      return {
        key: Number(item.key ?? item.day ?? index),
        value: item.value ?? item.label ?? item.name ?? '',
      }
    }

    const matched = defaultList.find((week) => week.value === item)
    return {
      key: matched?.key ?? index,
      value: item,
    }
  })
}

const weeks = computed(() => onNormalizeWeeks())

const weekStart = computed(() => weeks.value[0]?.key ?? 0)

const headerYearMonth = computed(() => {
  const curr = onGetYMD(currDateValue.value)
  const year = curr?.y ?? currYear.value ?? new Date().getFullYear()
  const month =
    curr?.m ?? (currMonth.value != null ? Number(currMonth.value) + 1 : new Date().getMonth() + 1)

  return `${year}-${onPad2(month)}`
})

const onSetDate = (date, month) => {
  const base = onParseDate(currDateValue.value) || todayDate.value
  const y = base.getFullYear()
  const m = onAddZero(base.getMonth() + (1 + (month || 0)))
  const d = onAddZero(base.getDate())

  // 固定用 12:00，避免時區造成日期前後偏移。
  const setDateObj =
    onParseDate(`${y}-${m}-${d}`) || new Date(y, Number(m) - 1, Number(d), 12, 0, 0, 0)

  if (date !== undefined) {
    setDateObj.setDate(date)
  }

  return setDateObj
}

const dates = computed(() => {
  if (!currDateValue.value) return []

  const dates = []
  const defaultDate = onSetDate(1)
  const defaultYearMonth = defaultDate.getFullYear() * 100 + defaultDate.getMonth() + 1
  const leadingDays = (defaultDate.getDay() - weekStart.value + 7) % 7

  const onGetDayData = (dateObj, type) => {
    return {
      date: onFormatConfig(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate(),
        'datePicker'
      ),
      year: dateObj.getFullYear(),
      month: onAddZero(dateObj.getMonth() + 1),
      zeroDay: onAddZero(dateObj.getDate()),
      day: dateObj.getDate(),
      ...(type ? { type } : null),
    }
  }

  for (let i = 0; i < 42; i += 1) {
    const days = onSetDate(i + 1 - leadingDays)
    const yearMonth = days.getFullYear() * 100 + days.getMonth() + 1

    if (yearMonth < defaultYearMonth) {
      dates.push(onGetDayData(days, 'last'))
    } else if (yearMonth === defaultYearMonth) {
      const isToday = onDateOnlyMs(days) === onDateOnlyMs(todayDate.value)
      dates.push(onGetDayData(days, isToday ? 'today' : null))
    } else {
      if (config.value.days === 'auto' && days.getDay() === weekStart.value) break
      dates.push(onGetDayData(days, 'next'))
    }
  }

  return dates
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      input: {
        main: '',
        elem: '',
        container: '',
        label: '',
        type: '',
        suffix: '',
        aide: '',
        error: '',
      },
    },
    ...props.setClass,
  }
})

const onBindClass = (item) => {
  return item.date === currDate.value
    ? '--curr'
    : onDateDisabled(item.date)
      ? '--disabled'
      : item.type === 'last'
        ? '--last'
        : item.type === 'next'
          ? '--next'
          : item.type === 'today'
            ? '--today'
            : null
}

const onChangeMonthDisabled = (value) => {
  if (!currDateValue.value) return false

  const curr = onGetYMD(currDateValue.value)
  if (!curr) return false

  const maxYear = onGetYearLabels()[0]?.value
  const minYear = onGetYearLabels()[onGetYearLabels().length - 1]?.value

  const max = onGetYMD(config.value.maxDate)
  const min = onGetYMD(config.value.minDate)

  const maxMonth = config.value.maxDate ? (max ? max.date.getMonth() : 11) : 11
  const minMonth = config.value.minDate ? (min ? min.date.getMonth() : 0) : 0

  return value > 0
    ? curr.y === maxYear && currMonth.value === maxMonth
    : curr.y === minYear && currMonth.value === minMonth
}

const onGetDefaultDate = () => {
  currDate.value = null
  formatDate.value = null

  if (model.value == null) {
    if (config.value.defaultIsToday) {
      const ymd = onGetYMD(todayDate.value)

      if (ymd) {
        currDate.value = onFormatConfig(ymd.y, ymd.m, ymd.d, 'datePicker')
        currDateValue.value = ymd.date
        formatDate.value = todayModel.value
      } else {
        currDateValue.value = onParseDate(config.value.maxDate) || todayDate.value
      }
    } else {
      currDate.value = null
      currDateValue.value = onParseDate(config.value.maxDate) || todayDate.value
      formatDate.value = null
    }
  } else if (model.value) {
    const ymd = onGetYMDByConfig(model.value, 'model')

    if (ymd) {
      currDate.value = onFormatConfig(ymd.y, ymd.m, ymd.d, 'datePicker')
      currDateValue.value = ymd.date

      formatDate.value = onFormatConfig(ymd.y, ymd.m, ymd.d, 'model')
    } else {
      currDateValue.value = onParseDate(config.value.maxDate) || todayDate.value
    }
  } else {
    currDateValue.value = onParseDate(config.value.maxDate) || todayDate.value
  }

  const curr = onGetYMD(currDateValue.value)
  currYear.value = curr ? curr.y : new Date().getFullYear()
  currMonth.value = curr ? curr.date.getMonth() : new Date().getMonth()
}

const onToggle = (value) => {
  isActive.value = value !== undefined ? value : !isActive.value
  isFocus.value = isActive.value
}

const onCalendarButtonPointerdown = (e) => {
  e.preventDefault()
  e.stopPropagation()
  onGetDefaultDate()
  onToggle(true)
}

const onInputPointerdown = (e) => {
  if (config.value.altInput) return

  e.preventDefault()
  e.stopPropagation()
  onGetDefaultDate()
  onToggle(true)
}

const onInputClick = () => {
  if (!config.value.altInput) return
  if (isActive.value) return

  onToggle(true)
  onGetDefaultDate()
}

const onChangeYear = () => {
  if (!currDateValue.value) return

  const curr = onGetYMD(currDateValue.value)
  if (!curr) return

  const next = onSafeDateFromYMD(currYear.value, curr.m, curr.d)
  currDateValue.value = next

  // currDate.value = currDateValue.value
}

const onChangeMonth = (value) => {
  if (!currDateValue.value) return

  const base = onGetYMD(currDateValue.value)
  if (!base) return

  const calcValue = value !== undefined ? value : currMonth.value - base.date.getMonth()

  // 安全加減月份，避免 1/31 加一個月變成 3/2。
  const next = onAddMonthsSafe(base.date, calcValue)

  // select change 時 value 會是 undefined，所以用目前 select 值與 base 月份計算差值。
  currDateValue.value = next

  const ymd = onGetYMD(currDateValue.value)
  currYear.value = ymd.y
  currMonth.value = ymd.date.getMonth()
}

const onKeydownDateMask = (e) => {
  const k = e.key
  const sep = allowedSep.value
  const onIsCtrlCombo = () => e.ctrlKey || e.metaKey
  const onIsNavKey = () =>
    k === 'Backspace' ||
    k === 'Delete' ||
    k === 'Tab' ||
    k === 'Enter' ||
    k === 'Escape' ||
    k.startsWith('Arrow') ||
    k === 'Home' ||
    k === 'End'

  // 1) 允許複製貼上與方向鍵等控制鍵。
  if (onIsCtrlCombo(e) || onIsNavKey(k)) return

  // 2) 允許數字。
  if (/^\d$/.test(k)) return

  // 3) 允許目前格式使用的分隔符。
  if (k === sep) return

  // 4) 其他按鍵阻擋。
  e.preventDefault()
}

const onFocusin = (e) => {
  if (config.value.altInput) onToggle(true)
  else isFocus.value = true

  onGetDefaultDate()
  emits('focusin', e)
}

const onFocusout = (e) => {
  onGetDefaultDate()

  if (formatDate.value && model.value !== formatDate.value) {
    model.value = formatDate.value
  }

  if (!isActive.value) isFocus.value = false

  emits('focusout', e)
}

const onSelect = (dateStr) => {
  const ymd = onGetYMD(dateStr)
  if (!ymd) return

  currDate.value = dateStr
  currDateValue.value = ymd.date

  formatDate.value = onFormatConfig(ymd.y, ymd.m, ymd.d, 'model')

  onToggle(false)
  emits('update:modelValue', formatDate.value)

  nextTick(() => {
    emits('selected')
  })
}

const onOpen = () => {
  if (isDatePickerPopup.value) return true
  const positionX =
    config.value.position === 'auto' || config.value.position === 'popup'
      ? config.value.position
      : config.value.position.split('-')[0]
  const positionY =
    config.value.position === 'auto' || config.value.position === 'popup'
      ? config.value.position
      : config.value.position.split('-')[1]
  const onClamp = (v, min, max) => Math.min(Math.max(v, min), max)

  if (!datePickerCalendarRef.value) return false

  const rect = datePickerContainerRef.value.getBoundingClientRect()
  const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight)
  const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth)
  const scrollTop = window.scrollY
  const scrollLeft = window.scrollX

  const datePickerMainTop = rect.top + scrollTop
  const datePickerMainHeight = datePickerContainerRef.value.scrollHeight
  const contentWidth = datePickerCalendarRef.value.scrollWidth
  const contentHeight = datePickerCalendarRef.value.scrollHeight
  const bottomTop = datePickerMainTop + datePickerMainHeight
  const topTop = datePickerMainTop - contentHeight

  // 依設定計算日曆展開位置。
  const rawTop =
    positionY === 'popup'
      ? scrollTop + viewHeight / 2 - contentHeight / 2
      : positionY === 'top'
        ? topTop
        : bottomTop

  const rawLeft =
    positionX === 'popup'
      ? scrollLeft + viewWidth / 2 - contentWidth / 2
      : positionX === 'left'
        ? scrollLeft + rect.left
        : positionX === 'right'
          ? scrollLeft + rect.right - contentWidth
          : scrollLeft + rect.left + rect.width / 2 - contentWidth / 2

  // 下方空間不足時改展開在容器上方；上方也放不下時維持 config 設定的位置。
  const isBottomOverflow = rawTop - scrollTop + contentHeight > viewHeight
  const isTopFits = topTop >= scrollTop
  const safeLeft = onClamp(rawLeft, scrollLeft, scrollLeft + viewWidth - contentWidth)
  const safeTop =
    positionY !== 'popup' && positionY !== 'top' && isBottomOverflow && isTopFits ? topTop : rawTop

  datePickerCalendarRef.value.style.left = `${safeLeft}px`
  datePickerCalendarRef.value.style.top = `${safeTop}px`
}

const onClickOutside = (e) => {
  if (isDatePickerPopup.value) return

  const { altInput } = config.value
  const $datePickerContainerRef = datePickerContainerRef.value
  const $datePickerIconRef = datePickerIconRef.value
  const $datePickerCalendarRef = datePickerCalendarRef.value
  if ($datePickerContainerRef?.contains(e.target)) return
  if ($datePickerIconRef?.contains(e.target)) return

  const isOutSide = altInput
    ? $datePickerCalendarRef &&
      !$datePickerCalendarRef.contains(e.target) &&
      !$datePickerContainerRef.contains(e.target)
    : $datePickerIconRef
      ? $datePickerCalendarRef &&
        !$datePickerCalendarRef.contains(e.target) &&
        !$datePickerIconRef.contains(e.target)
      : $datePickerCalendarRef && !$datePickerCalendarRef.contains(e.target)

  if (isOutSide) {
    isActive.value = false
    isFocus.value = false
  }
}

const onResizeDone = (func) => {
  let timer
  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(func, 200)
  }
}

/**
 * 外部 config maxDate / minDate / modelValue 變更時，同步內部日期狀態。
 */
watch(
  () => [config.value.maxDate, config.value.minDate],
  () => {
    // 若目前日期超過 maxDate，將日曆停在 maxDate。
    const maxMs = onDateOnlyMs(config.value.maxDate)
    const currMs = onDateOnlyMs(currDateValue.value)
    if (maxMs != null && currMs != null && currMs > maxMs) {
      currDateValue.value = onParseDate(config.value.maxDate)
    }

    const curr = onGetYMD(currDateValue.value)
    if (curr) {
      currYear.value = curr.y
      currMonth.value = curr.date.getMonth()
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  () => {
    onGetDefaultDate()
  },
  { immediate: true }
)

onMounted(() => {
  onResize()
  onGetDefaultDate()
  document.addEventListener('click', onClickOutside, true)
  window.addEventListener('resize', () => {
    onResize()
    onResizeDone(onOpen)
  })
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside, true)
  window.removeEventListener('resize', () => {
    onResize()
    onResizeDone(onOpen)
  })
})
</script>

<template>
  <div class="m-datepicker --single" :class="setClass.main">
    <Field
      :name="props.name"
      :type="props.type"
      :rules="props.rules"
      v-model="datePickerModel"
      v-slot="{ field, errorMessage }"
    >
      <div class="m-datepicker-container" ref="datePickerContainerRef">
        <div
          class="m-datepicker-element jFormValid flex items-center rounded-[--datepacker-rounded] border-[1px] border-[--datepacker-border-color] bg-[--datepacker-bg-color] px-[--datepacker-padding-x] leading-[1] text-[--datepacker-color] transition-colors duration-300"
          :class="[
            setClass.label,
            { '--required': model },
            { '--focus': isFocus },
            { '--error': errorMessage },
          ]"
        >
          <input
            :type="inputType"
            class="m-datepicker-type h-full w-full bg-transparent text-[--datepacker-type-size]"
            v-bind="field"
            :minlength="config.length"
            :maxlength="config.length"
            :placeholder="config.placeholder"
            :readonly="!config.altInput"
            :format="onConfigFormat('datePicker')"
            :value="datePickerModel"
            autocomplete="off"
            @pointerdown="onInputPointerdown($event)"
            @keydown="onKeydownDateMask($event)"
            @focusin="onFocusin($event)"
            @click="onInputClick()"
            @focusout="onFocusout($event)"
            @input="emits('input', $event)"
            @keydown.enter="emits('keydown.enter')"
          />
          <div class="m-datepicker-ctrl">
            <button
              type="button"
              class="h-[--datepacker-icon-size] w-[--datepacker-icon-size]"
              @pointerdown="onCalendarButtonPointerdown($event)"
              ref="datePickerIconRef"
            >
              <CommonSvgIcon icon="icon_calendar" class="h-full w-full" />
            </button>
          </div>
        </div>
      </div>
    </Field>

    <ErrorMessage
      as="span"
      class="m-datepicker-error mt-[2px] flex items-center text-left text-[var(--red-f00)] m:text-[13px] pt:text-[14px]"
      :class="setClass.error"
      :name="props.name"
      v-slot="{ message }"
      v-if="(config.altInput && !isActive) || !config.altInput"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>

  <Teleport to="body">
    <Transition
      :name="isDatePickerPopup ? 'detepacker-overlay' : 'datepicker'"
      appear
      @enter="onOpen"
    >
      <div
        class="m-datapicker-calendar z-[3]"
        :class="[isDatePickerPopup ? 'fixed inset-0 flex items-center justify-center' : 'absolute']"
        ref="datePickerCalendarRef"
        v-if="isActive"
        @click.self="isDatePickerPopup ? onToggle(false) : null"
      >
        <Transition name="detepacker-bomb" appear>
          <div
            class="m-datapicker-calendar-container relative z-[1] my-[--datepacker-calendar-margin-y] overflow-hidden rounded-[--datepacker-calendar-rounded] border-[1px] border-[--datepacker-calendar-border-color] bg-[--white] px-[--datepacker-calendar-padding-x] py-[--datepacker-calendar-padding-y] transition-colors duration-300"
            v-if="isActive"
          >
            <ul
              class="m-datapicker-calendar-header relative flex items-center bg-[var(--red-b12b)]"
            >
              <li class="flex-shrink-0">
                <button
                  type="button"
                  class="flex h-[--datepacker-arrow-size] w-[--datepacker-arrow-size] items-center justify-center rounded-[--datepacker-arrow-rounded] bg-[--datepacker-arrow-bg-color] text-[--datepacker-arrow-color] transition-opacity duration-300 disabled:opacity-30"
                  @click="onChangeMonth(-1)"
                  :disabled="onChangeMonthDisabled(-1)"
                >
                  <CommonSvgIcon
                    icon="chevron_left"
                    class="h-[--datepacker-arrow-icon-size] w-[--datepacker-arrow-icon-size]"
                  />
                </button>
              </li>

              <li
                class="m-datapicker-calendar-header-container grow text-[--datepacker-calendar-header-color]"
              >
                <span class="block text-center" v-if="config.headerMode === 'string'">
                  {{ headerYearMonth }}
                </span>

                <ul class="flex items-center" v-else>
                  <li class="w-1/2 px-[5px]">
                    <div class="m-datapicker-calendar-select relative w-full">
                      <select
                        :name="`${props.name}_month`"
                        v-model="currMonth"
                        @change="onChangeMonth()"
                      >
                        <option
                          class="m-datapicker-calendar-option"
                          :value="index"
                          v-for="(item, index) in months"
                          :key="`${props.name}_${item}_${index}`"
                        >
                          {{ item }}
                        </option>
                      </select>
                      <SvgIcon
                        icon="arrow_bottom"
                        class="absolute right-0 top-1/2 h-[12px] w-[12px] -translate-y-1/2 transform"
                      />
                    </div>
                  </li>

                  <li class="w-1/2 px-[5px]">
                    <div class="m-datapicker-calendar-select relative w-full">
                      <select
                        :name="`${props.name}_year`"
                        v-model="currYear"
                        @change="onChangeYear()"
                      >
                        <option
                          class="m-datapicker-calendar-option"
                          :value="item.value"
                          v-for="(item, index) in onGetYearLabels()"
                          :key="`${props.name}_${item.value}_${index}`"
                        >
                          {{ item.key }}
                        </option>
                      </select>
                      <CommonSvgIcon
                        icon="arrow_bottom"
                        class="absolute right-0 top-1/2 h-[12px] w-[12px] -translate-y-1/2 transform"
                      />
                    </div>
                  </li>
                </ul>
              </li>

              <li class="flex-shrink-0">
                <button
                  type="button"
                  class="flex h-[--datepacker-arrow-size] w-[--datepacker-arrow-size] items-center justify-center rounded-[--datepacker-arrow-rounded] bg-[--datepacker-arrow-bg-color] text-[--datepacker-arrow-color] transition-opacity duration-300 disabled:opacity-30"
                  @click="onChangeMonth(1)"
                  :disabled="onChangeMonthDisabled(1)"
                >
                  <CommonSvgIcon
                    icon="chevron_right"
                    class="h-[--datepacker-arrow-icon-size] w-[--datepacker-arrow-icon-size]"
                  />
                </button>
              </li>
            </ul>

            <div
              class="m-datapicker-calendar-weeks flex items-center bg-[--datepacker-calendar-week-bg-color] text-[--datepacker-calendar-week-color]"
            >
              <div
                class="m-datapicker-calendar-cell p-[--datepacker-calendar-cell-padding]"
                v-for="(item, index) in weeks"
                :key="`${props.name}_${item.key}_${index}`"
              >
                <span
                  class="m-datapicker-calendar-week flex h-[--datepacker-calendar-cell-size] w-[--datepacker-calendar-cell-size] items-center justify-center"
                >
                  {{ item.value }}
                </span>
              </div>
            </div>

            <div class="m-datapicker-calendar-dates grid grid-cols-7 items-center">
              <div
                class="m-datapicker-calendar-cell p-[--datepacker-calendar-cell-padding]"
                v-for="(item, index) in dates"
                :key="`${props.name}_${item.date}_${index}`"
              >
                <span
                  class="m-datepicker-calendar-ctrl"
                  :class="onBindClass(item)"
                  v-if="onDateDisabled(item.date)"
                >
                  {{ item.day }}
                </span>
                <button
                  type="button"
                  class="m-datepicker-calendar-ctrl"
                  :class="onBindClass(item)"
                  @click="onSelect(item.date, item)"
                  v-else
                >
                  {{ item.day }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="postcss">
:root {
  --datepacker-padding-x: 12px;
  --datepacker-rounded: 5px;
  --datepacker-type-size: 16px;
  --datepacker-icon-size: 16px;
  --datepacker-bg-color: var(--white);
  --datepacker-color: var(--gray-999);
  --datepacker-border-color: var(--gray-e5);
  --datepacker-focus-color: var(--green-6a2d);
  --datepacker-focus-border-color: var(--green-6a2d);
  --datepacker-error-color: var(--orange-e646);
  --datepacker-error-border-color: var(--orange-e646);
  --datepacker-calendar-margin-y: 10px;
  --datepacker-calendar-padding-x: 24px;
  --datepacker-calendar-padding-y: 24px;
  --datepacker-calendar-border-color: var(--green-6a2d);
  --datepacker-calendar-rounded: 5px;
  --datepacker-arrow-size: 35px;
  --datepacker-arrow-rounded: 5px;
  --datepacker-arrow-bg-color: var(--gray-f7);
  --datepacker-arrow-color: var(--gray-666);
  --datepacker-arrow-icon-size: 18px;
  --datepacker-calendar-cell-size: 35px;
  --datepacker-calendar-cell-padding: 0;
  --datepacker-calendar-header-text: 14px;
  --datepacker-calendar-header-color: var(--gray-333);
  --datepacker-calendar-week-text: 14px;
  --datepacker-calendar-week-bg-color: transparent;
  --datepacker-calendar-week-color: var(--gray-666);
  --datepacker-calendar-date-text: 14px;
  --datepacker-calendar-date-color: var(--gray-666);
  --datepacker-calendar-today-bg-color: var(--green-8b0d);
  --datepacker-calendar-today-color: var(--white);
  --datepacker-calendar-today-border-width: 0;
  --datepacker-calendar-today-border-color: transparent;
  --datepacker-calendar-curr-bg-color: var(--orange-e646);
  --datepacker-calendar-curr-color: var(--white);
  --datepacker-calendar-curr-border-width: 0;
  --datepacker-calendar-curr-border-color: transparent;
  --datepacker-calendar-last-bg-color: transparent;
  --datepacker-calendar-last-color: var(--gray-ccce);
  --datepacker-calendar-last-border-width: 0;
  --datepacker-calendar-last-border-color: transparent;
  --datepacker-calendar-next-bg-color: transparent;
  --datepacker-calendar-next-color: var(--gray-ccce);
  --datepacker-calendar-next-border-width: 0;
  --datepacker-calendar-next-border-color: transparent;
  --datepacker-calendar-disabled-bg-color: transparent;
  --datepacker-calendar-disabled-color: var(--gray-e5);
  --datepacker-calendar-disabled-border-width: 0;
  --datepacker-calendar-disabled-border-color: transparent;
  --datepacker-calendar-date-rounded: 10px;
}

.m-datapicker-calendar {
  &.fixed {
    &:before {
      @apply absolute inset-0 bg-[--black] opacity-40 content-default;
    }
  }
}

.m-datepicker-element {
  /* &.\-\-required {
    @apply border-[var(--gray-4448)];
  } */

  &.\-\-error {
    --datepacker-color: var(--datepacker-error-color);
    --datepacker-border-color: var(--datepacker-error-border-color);
  }

  &.\-\-focus {
    --datepacker-color: var(--datepacker-focus-color);
    --datepacker-border-color: var(--datepacker-focus-border-color);
  }
}

.m-datapicker-calendar-container {
  box-shadow: 0 0 8px 0 rgba(var(--black-rgb), 0.2);
}

.m-datapicker-calendar-header-container {
  font-size: var(--datepacker-calendar-header-text);
}

.m-datapicker-calendar-select {
  select {
    font-size: var(--datepacker-calendar-header-text);

    @apply w-full bg-transparent text-center leading-[inherit];
  }
}

.m-datapicker-calendar-option {
  @apply text-[var(--black)];
}

.m-datapicker-calendar-week {
  font-size: var(--datepacker-calendar-week-text);
}

.m-datepicker-calendar-ctrl {
  font-size: var(--datepacker-calendar-date-text);

  @apply flex h-[--datepacker-calendar-cell-size] w-[--datepacker-calendar-cell-size] items-center justify-center rounded-[--datepacker-calendar-date-rounded] border-solid leading-[1] text-[--datepacker-calendar-date-color] transition-colors duration-300;

  &.\-\-curr {
    border-width: var(--datepacker-calendar-curr-border-width);
    border-color: var(--datepacker-calendar-curr-border-color);
    @apply bg-[--datepacker-calendar-curr-bg-color] text-[--datepacker-calendar-curr-color];
  }

  &.\-\-last {
    border-width: var(--datepacker-calendar-last-border-width);
    border-color: var(--datepacker-calendar-last-border-color);

    @apply bg-[--datepacker-calendar-last-bg-color] text-[--datepacker-calendar-last-color];
  }

  &.\-\-next {
    border-width: var(--datepacker-calendar-next-border-width);
    border-color: var(--datepacker-calendar-next-border-color);

    @apply bg-[--datepacker-calendar-next-bg-color] text-[--datepacker-calendar-next-color];
  }

  &.\-\-today {
    border-width: var(--datepacker-calendar-today-border-width);
    border-color: var(--datepacker-calendar-today-border-color);
    @apply bg-[--datepacker-calendar-today-bg-color] text-[--datepacker-calendar-today-color];
  }

  &.\-\-disabled {
    border-width: var(--datepacker-calendar-disabled-border-width);
    border-color: var(--datepacker-calendar-disabled-border-color);
    @apply cursor-not-allowed bg-[--datepacker-calendar-disabled-bg-color] text-[--datepacker-calendar-disabled-color];
  }
}

/* .m-datepicker-clear {
  text-indent: -99999px;

  &:before,
  &:after {
    @apply absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[#000] content-default;
  }

  &:before {
    @apply rotate-45;
  }

  &:after {
    @apply -rotate-45;
  }
} */

/* @screen m {
  .m-datepicker-clear {
    &:before,
    &:after {
      @apply h-[20px] w-[2px];
    }
  }
} */

@screen p {
  .m-datepicker {
    &.\-\-single {
      &.\-\-h-40,
      &.p\:\-\-h-40,
      &.pt\:\-\-h-40 {
        .m-datepicker-element {
          @apply h-[40px];
        }
      }
    }
  }
}

@screen t {
  .m-datepicker {
    &.\-\-single {
      &.\-\-h-40,
      &.p\:\-\-h-40,
      &.pt\:\-\-h-40,
      &.tm\:\-\-h-40 {
        .m-datepicker-element {
          @apply h-[40px];
        }
      }
    }
  }
}

@screen m {
  .m-datepicker {
    &.\-\-single {
      &.\-\-h-40,
      &.tm\:\-\-h-40,
      &.m\:\-\-h-40 {
        .m-datepicker-element {
          @apply h-[40px];
        }
      }
    }
  }
}
</style>
