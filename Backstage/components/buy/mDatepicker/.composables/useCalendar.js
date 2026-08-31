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
  onGetYMD,
  onGetYMDByFormat,
  onPad2,
  onParseDate,
  onPickFormat,
  onSafeDateFromYMD,
} from './useDateCore.js'
import { monthLabels, weekLabels } from './useConfig.js'

export const useCalendar = (config, model) => {
  // 已選中的日期(datePicker 格式,給畫面比對用)
  const currDate = ref(null)
  // 已選中的日期(model 格式,給呼叫端)
  const formatDate = ref(null)
  // 日曆目前停在哪一天(Date 物件),換月換年動的是這個
  const currDateValue = ref(null)
  const currYear = ref(null)
  const currMonth = ref(null)

  const onFormat = (type = 'datePicker') => onPickFormat(config.value.format, type)

  const onFormatBy = (y, m, d, type = 'datePicker') => onFormatYMD(y, m, d, onFormat(type))

  const onGetYMDByConfig = (value, type = 'model') => onGetYMDByFormat(value, onFormat(type))

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

  const yearOptions = computed(() => {
    const maxDate = config.value.today || config.value.maxDate
    const maxYear =
      maxDate && !config.value.showOverDate
        ? (onGetYMDByConfig(maxDate)?.y ?? new Date().getFullYear())
        : new Date().getFullYear()
    const minYear =
      config.value.minDate && !config.value.showOverDate
        ? onGetYMDByConfig(config.value.minDate)?.y || 1911
        : 1911

    const years = []
    for (let i = maxYear + config.value.maximumYear; i >= minYear; i -= 1) {
      years.push({ key: i, value: i })
    }

    return years
  })

  // 停在 maxDate 那一年時,超過 maxDate 的月份不列出來
  const monthOptions = computed(() => {
    const maxDateValue =
      typeof config.value.maxDate === 'object' ? +config.value.maxDate : config.value.maxDate

    const curr = onGetYMD(currDateValue.value)
    const max = onGetYMD(maxDateValue)
    const labels = monthLabels[config.value.lang] || monthLabels.ch

    const maxMonth =
      config.value.maxDate && curr && max && curr.y === max.y && !config.value.showOverDate
        ? max.date.getMonth() + 1
        : labels.length

    return labels.slice(0, maxMonth).map((value, index) => ({ key: index, value }))
  })

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

  const onBindClass = (item) => {
    if (item.date === currDate.value) return '--curr'
    if (onDateDisabled(item.date)) return '--disabled'
    if (item.type === 'last') return '--last'
    if (item.type === 'next') return '--next'
    if (item.type === 'today') return '--today'

    return null
  }

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
    onBindClass,
    onChangeMonth,
    onChangeMonthDisabled,
    onChangeYear,
    onSetMonth,
    onSyncFromModel,
    onSelectDate,
  }
}
