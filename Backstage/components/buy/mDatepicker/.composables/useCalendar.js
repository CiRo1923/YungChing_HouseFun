/* 日曆的瀏覽狀態:現在停在哪一年哪一月、格子怎麼排、哪些日期不能點。
  邏輯全部沿用原本 Single.vue 的版本,只是搬出來讓 Calendar / Single 共用。

  用法:const calendar = useCalendar(config, model)
    config  computed<Object>  已經 merge 過的設定
    model   Ref<any>          呼叫端的 v-model 值(model 格式) */

import {
  onAddMonthsSafe,
  onDateOnlyMs,
  onFormatYMD,
  onGetClientToday,
  onGetDatePrecision,
  onGetYMD,
  onGetYMDByFormat,
  onPad2,
  onParseDate,
  onPickFormat,
  onSafeDateFromYMD,
  onSplitDateTimeFormat,
} from './useDateCore.js'
import { monthLabels, weekLabels } from './useConfig.js'

/* options.range  Ref<{ start, end } | null> —— 區間選擇的起訖(Date 或任何 onParseDate 吃得下的值)。
    只有 Range 那支會傳;單選不傳,range 相關的 class 就一律不出現。 */
export const useCalendar = (config, model, options = {}) => {
  const rangeRef = options.range ?? ref(null)

  // 已選中的日期(datePicker 格式,給畫面比對用)
  const currDate = ref(null)
  // 已選中的日期(model 格式,給呼叫端)
  const formatDate = ref(null)
  // 日曆目前停在哪一天(Date 物件),換月換年動的是這個
  const currDateValue = ref(null)
  const currYear = ref(null)
  const currMonth = ref(null)

  const onFormat = (type = 'datePicker') => onPickFormat(config.value.format, type)

  /* ⚠️ 一定要先把 format 的時間段切掉再組字 —— onFormatYMD 只認得 YYYY / MM / DD,
      直接餵 'YYYY-MM-DD hh:mm' 給它,時間那半會原封不動留在輸出裡
      (得到 '2026-09-04 hh:mm')。

      這支**只負責日期**。時間是獨立的一個欄位(Time.vue),值由呼叫端把兩半接起來。 */
  const onFormatBy = (y, m, d, type = 'datePicker') => {
    const { date: dateFormat } = onSplitDateTimeFormat(onFormat(type))

    return onFormatYMD(y, m, d, dateFormat)
  }

  const onGetYMDByConfig = (value, type = 'model') => onGetYMDByFormat(value, onFormat(type))

  /* 選到哪一層,由畫面用的 format 決定 —— 'year' | 'month' | 'day'。
    看 datePicker 而不是 model:畫面能不能點到日,是畫面格式的事
    (model 存 YYYYMMDD、畫面顯示 YYYY-MM 這種組合仍然合理)。 */
  const precision = computed(() => onGetDatePrecision(onFormat('datePicker')))

  /* ---- 今天 ---- */

  // config.today 通常餵 server 時間,沒給才用 client 的今天
  const todayDate = computed(() => {
    if (config.value.today != null && config.value.today !== '') {
      return onParseDate(config.value.today) || onGetClientToday()
    }

    return onGetClientToday()
  })

  const today = computed(() => {
    const ymd = onGetYMD(todayDate.value)

    return ymd ? onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker') : ''
  })

  const todayModel = computed(() => {
    const ymd = onGetYMD(todayDate.value)

    return ymd ? onFormatBy(ymd.y, ymd.m, ymd.d, 'model') : ''
  })

  /* ---- min / max ---- */

  const onDateDisabled = (dateStr) => {
    const dateMs = onDateOnlyMs(dateStr)
    if (dateMs == null) return false

    const maxMs =
      config.value.maxDate !== '' && config.value.maxDate != null
        ? onDateOnlyMs(config.value.maxDate)
        : null
    const minMs =
      config.value.minDate !== '' && config.value.minDate != null
        ? onDateOnlyMs(config.value.minDate)
        : null

    return !!((maxMs != null && dateMs > maxMs) || (minMs != null && dateMs < minMs))
  }

  /* ---- 年 / 月清單 ---- */

  /* 年 / 月清單一律列出完整範圍,超出 min / max 的由 onYearDisabled / onMonthDisabled
    標成不能點 —— 與日曆格子的行為一致(那邊也是照樣顯示、只給 --disabled)。

    ⚠️ 不要改回「不列出」:清單少了幾格看起來像資料壞了,而且使用者無法從畫面上
        知道那些月份是被上限擋掉的。 */
  const yearOptions = computed(() => {
    /* 上限取「今年」與 maxDate 的年較晚的那個 —— maxDate 落在未來時要選得到,
      落在過去時今年仍然要列出來(只是點不到)。 */
    const currentYear = onGetYMD(todayDate.value)?.y ?? new Date().getFullYear()
    const maxDateYear = config.value.maxDate
      ? (onGetYMDByConfig(config.value.maxDate)?.y ?? currentYear)
      : currentYear

    const maxYear = Math.max(currentYear, maxDateYear)
    const minYear = 1911

    const years = []
    for (let i = maxYear + config.value.maximumYear; i >= minYear; i -= 1) {
      years.push({ key: i, value: i })
    }

    return years
  })

  const monthOptions = computed(() => {
    const labels = monthLabels[config.value.lang] || monthLabels.ch

    return labels.map((value, index) => ({ key: index, value }))
  })

  /* 整年(整月)都落在 min / max 之外才停用 —— 只要有一天在範圍內就要能點進去,
    不然 maxDate 是 9/7 的時候整個 9 月會被停掉。 */
  const onYearDisabled = (year) => {
    const y = Number(year)
    if (!Number.isFinite(y)) return false

    return onDateDisabled(onSafeDateFromYMD(y, 1, 1)) && onDateDisabled(onSafeDateFromYMD(y, 12, 31))
  }

  // monthIndex 是 0-11,對齊 Date 的 getMonth()
  const onMonthDisabled = (monthIndex) => {
    const y = Number(currYear.value)
    const m = Number(monthIndex) + 1
    if (!Number.isFinite(y) || !Number.isFinite(m)) return false

    // 這個月的最後一天 —— 下個月的第 0 天
    const lastDay = new Date(y, m, 0).getDate()

    return (
      onDateDisabled(onSafeDateFromYMD(y, m, 1)) && onDateDisabled(onSafeDateFromYMD(y, m, lastDay))
    )
  }

  /* ---- 星期列 ---- */

  // config.weeks 可以是 { ch: [...] } 也可以直接給陣列,元素可以是物件或純字串
  const weeks = computed(() => {
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

      return { key: defaultList.find((week) => week.value === item)?.key ?? index, value: item }
    })
  })

  // 一週從星期幾開始,由 weeks 的第一個決定
  const weekStart = computed(() => weeks.value[0]?.key ?? 0)

  const headerYearMonth = computed(() => {
    const curr = onGetYMD(currDateValue.value)
    const year = curr?.y ?? currYear.value ?? new Date().getFullYear()
    const month =
      curr?.m ?? (currMonth.value != null ? Number(currMonth.value) + 1 : new Date().getMonth() + 1)

    return `${year}-${onPad2(month)}`
  })

  /* ---- 日期格子 ---- */

  const onSetDate = (date, month) => {
    const base = onParseDate(currDateValue.value) || todayDate.value
    const target = onSafeDateFromYMD(
      base.getFullYear(),
      base.getMonth() + 1 + (month || 0),
      base.getDate()
    )
    const setDateObj = target || new Date(base.getTime())

    if (date !== undefined) setDateObj.setDate(date)

    return setDateObj
  }

  const dates = computed(() => {
    if (!currDateValue.value) return []

    const list = []
    const defaultDate = onSetDate(1)
    const defaultYearMonth = defaultDate.getFullYear() * 100 + defaultDate.getMonth() + 1
    // 這個月 1 號前面要補幾格上個月的日期
    const leadingDays = (defaultDate.getDay() - weekStart.value + 7) % 7

    const onGetDayData = (dateObj, type) => ({
      date: onFormatBy(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate(),
        'datePicker'
      ),
      year: dateObj.getFullYear(),
      month: onPad2(dateObj.getMonth() + 1),
      zeroDay: onPad2(dateObj.getDate()),
      day: dateObj.getDate(),
      ...(type ? { type } : null),
    })

    for (let i = 0; i < 42; i += 1) {
      const days = onSetDate(i + 1 - leadingDays)
      const yearMonth = days.getFullYear() * 100 + days.getMonth() + 1

      if (yearMonth < defaultYearMonth) {
        list.push(onGetDayData(days, 'last'))
      } else if (yearMonth === defaultYearMonth) {
        const isToday = onDateOnlyMs(days) === onDateOnlyMs(todayDate.value)
        list.push(onGetDayData(days, isToday ? 'today' : null))
      } else {
        // auto:排到下個月的第一個週起始日就收掉,不硬補滿六列
        if (config.value.days === 'auto' && days.getDay() === weekStart.value) break
        list.push(onGetDayData(days, 'next'))
      }
    }

    return list
  })

  /* 區間比對的粒度跟著精度走 —— 只選年的時候要比「年」,只到月的時候比「年月」。
    用可比大小的整數鍵(2026 / 202609 / 20260904),而不是毫秒:
    只到月的精度下,3 月 1 日與 3 月 31 日都該算同一格。 */
  const onRangeKeyOf = (value) => {
    const ymd = onGetYMD(value)
    if (!ymd) return null

    if (precision.value === 'year') return ymd.y
    if (precision.value === 'month') return ymd.y * 100 + ymd.m

    return ymd.y * 10000 + ymd.m * 100 + ymd.d
  }

  /* 區間的 class。起訖各自一個(要能單獨設圓角),中間一律 --in-range。
    只選了起、還沒選訖時,那一格同時是頭也是尾 —— 兩邊都給,圓角才會是完整的一顆。 */
  const onRangeClassOf = (key) => {
    const range = rangeRef.value
    if (!range || key == null) return []

    const startKey = onRangeKeyOf(range.start)
    if (startKey == null) return []

    const endKey = onRangeKeyOf(range.end)

    if (endKey == null) return key === startKey ? ['--range-start', '--range-end'] : []

    const list = []

    if (key === startKey) list.push('--range-start')
    if (key === endKey) list.push('--range-end')
    if (key > startKey && key < endKey) list.push('--in-range')

    return list
  }

  const onRangeClass = (dateStr) => onRangeClassOf(onRangeKeyOf(dateStr))

  /* 年清單與月清單的區間 class —— 精度停在那一層時才標,
    否則(例如 format 到日、只是借年清單換年)區間標在年份上會很怪。 */
  const onRangeClassByYear = (year) =>
    precision.value === 'year' ? onRangeClassOf(Number(year)) : []

  const onRangeClassByMonth = (monthIndex) =>
    precision.value === 'month'
      ? onRangeClassOf(Number(currYear.value) * 100 + Number(monthIndex) + 1)
      : []

  /* ⚠️ 狀態那幾個維持「互斥、只回一個」的優先鏈 —— 原本就是這個行為,
      改成全部並存會讓「今天且被選中」的格子同時吃到 --curr 與 --today,
      畫面會變。區間的 class 是**附加**上去的,不影響那條鏈。 */
  const onBindStateClass = (item) => {
    if (item.date === currDate.value) return '--curr'
    if (onDateDisabled(item.date)) return '--disabled'
    if (item.type === 'last') return '--last'
    if (item.type === 'next') return '--next'
    if (item.type === 'today') return '--today'

    return null
  }

  // 回陣列 —— 狀態一個 + 區間 0~2 個。Vue 的 :class 吃陣列,呼叫端不必改寫法
  const onBindClass = (item) => [onBindStateClass(item), ...onRangeClass(item.date)].filter(Boolean)

  /* ---- 換年 / 換月 ---- */

  const onChangeMonthDisabled = (value) => {
    const curr = onGetYMD(currDateValue.value)
    if (!curr) return false

    const years = yearOptions.value
    const maxYear = years[0]?.value
    const minYear = years[years.length - 1]?.value

    const max = onGetYMD(config.value.maxDate)
    const min = onGetYMD(config.value.minDate)
    const maxMonth = config.value.maxDate ? (max ? max.date.getMonth() : 11) : 11
    const minMonth = config.value.minDate ? (min ? min.date.getMonth() : 0) : 0

    return value > 0
      ? curr.y === maxYear && currMonth.value === maxMonth
      : curr.y === minYear && currMonth.value === minMonth
  }

  const onChangeYear = (year) => {
    if (year !== undefined) currYear.value = year
    if (!currDateValue.value) return

    const curr = onGetYMD(currDateValue.value)
    if (!curr) return

    currDateValue.value = onSafeDateFromYMD(currYear.value, curr.m, curr.d)
  }

  // value 是「相對月數」(-1 / 1);不給就用目前 currMonth 與基準月的差值
  const onChangeMonth = (value) => {
    if (!currDateValue.value) return

    const base = onGetYMD(currDateValue.value)
    if (!base) return

    const calcValue = value !== undefined ? value : currMonth.value - base.date.getMonth()

    currDateValue.value = onAddMonthsSafe(base.date, calcValue)

    const ymd = onGetYMD(currDateValue.value)
    currYear.value = ymd.y
    currMonth.value = ymd.date.getMonth()
  }

  // 面板直接指定月份(0-11)
  const onSetMonth = (month) => {
    currMonth.value = month
    onChangeMonth()
  }

  /* ---- 與 model 同步 ---- */

  const onSyncFromModel = () => {
    currDate.value = null
    formatDate.value = null

    const fallback = () => {
      currDateValue.value = onParseDate(config.value.maxDate) || todayDate.value
    }

    if (model.value == null) {
      if (config.value.defaultIsToday) {
        const ymd = onGetYMD(todayDate.value)

        if (ymd) {
          currDate.value = onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker')
          currDateValue.value = ymd.date
          formatDate.value = todayModel.value
        } else {
          fallback()
        }
      } else {
        fallback()
      }
    } else if (model.value) {
      const ymd = onGetYMDByConfig(model.value, 'model')

      if (ymd) {
        currDate.value = onFormatBy(ymd.y, ymd.m, ymd.d, 'datePicker')
        currDateValue.value = ymd.date
        formatDate.value = onFormatBy(ymd.y, ymd.m, ymd.d, 'model')
      } else {
        fallback()
      }
    } else {
      fallback()
    }

    const curr = onGetYMD(currDateValue.value)
    currYear.value = curr ? curr.y : new Date().getFullYear()
    currMonth.value = curr ? curr.date.getMonth() : new Date().getMonth()
  }

  // 點某一天。回傳 model 格式的值,由呼叫端決定要不要 emit
  const onSelectDate = (dateStr) => {
    const ymd = onGetYMD(dateStr)
    if (!ymd) return null

    currDate.value = dateStr
    currDateValue.value = ymd.date
    formatDate.value = onFormatBy(ymd.y, ymd.m, ymd.d, 'model')

    return formatDate.value
  }

  /* 寫入一個「年月日」並回傳 model 格式的值 —— precision 為 year / month 時,
    沒寫進 format 的那幾段補 1,onFormatYMD 也不會輸出它們。
    與 onSelectDate 分開:那支是「點日曆格子」,這支是「點年 / 月清單」。 */
  const onSelectYMD = (y, m = 1, d = 1) => {
    const date = onSafeDateFromYMD(y, m, d)
    if (!date) return null

    currYear.value = y
    currMonth.value = m - 1
    currDateValue.value = date
    currDate.value = onFormatBy(y, m, d, 'datePicker')
    formatDate.value = onFormatBy(y, m, d, 'model')

    return formatDate.value
  }

  // 點年清單。precision 為 year 時這就是最終值;更細的精度只是換年瀏覽(走 onChangeYear)
  const onSelectYear = (year) => onSelectYMD(year)

  // 點月清單(0-11)。precision 為 month 時這是最終值
  const onSelectMonth = (monthIndex) => onSelectYMD(currYear.value, monthIndex + 1)

  /* maxDate / minDate 是外部餵的(常常晚一步才回來),
    變更時若目前停的日期已經超過 maxDate,把日曆拉回 maxDate。 */
  watch(
    () => [config.value.maxDate, config.value.minDate],
    () => {
      const maxMs = onDateOnlyMs(config.value.maxDate)
      const currMs = onDateOnlyMs(currDateValue.value)

      if (maxMs != null && currMs != null && currMs > maxMs) {
        currDateValue.value = onParseDate(config.value.maxDate)
      }

      const curr = onGetYMD(currDateValue.value)
      if (!curr) return

      currYear.value = curr.y
      currMonth.value = curr.date.getMonth()
    },
    { immediate: true }
  )

  return {
    currDate,
    currDateValue,
    currYear,
    currMonth,
    formatDate,
    today,
    todayModel,
    todayDate,
    weeks,
    dates,
    yearOptions,
    monthOptions,
    headerYearMonth,
    onFormat,
    onFormatBy,
    onGetYMDByConfig,
    onDateDisabled,
    onYearDisabled,
    onMonthDisabled,
    onBindClass,
    onChangeMonth,
    onChangeMonthDisabled,
    onChangeYear,
    onSetMonth,
    onSyncFromModel,
    onSelectDate,
    precision,
    onSelectYMD,
    onSelectYear,
    onSelectMonth,
    onRangeClassByYear,
    onRangeClassByMonth,
    range: rangeRef,
  }
}
