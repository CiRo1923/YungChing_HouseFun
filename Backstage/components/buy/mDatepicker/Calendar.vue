<script setup>
/* 日曆面板本體:header + 星期列 + 日期格。
  header 依 config.headerMode 換一支元件('string' 純文字 / 'panel' 點年月展開面板),
  面板模式下年、月各自是獨立元件,要改哪一種就只動那一支。

  ⚠️ 這支只負責畫面 —— 日期狀態全在 props.calendar(useCalendar 的實例)裡,
      由 Single 建立後傳進來,選了哪天用 emit 回報。 */

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  config: {
    type: Object,
    required: true,
  },
  // useCalendar() 的回傳值
  calendar: {
    type: Object,
    required: true,
  },
})

/* select   點日曆格子 —— 傳 datePicker 格式的日期字串
  selectYMD 點年 / 月清單而且那就是最終值(format 只到年或只到月)—— 傳 { y, m, d }

  ⚠️ 時間不在這個浮層裡 —— format 帶時間段時,時間是**獨立的一個欄位**(Time.vue),
      由呼叫端並排放在日期欄位旁邊。 */
const emits = defineEmits(['select', 'selectYMD'])

/* 主面板是哪一個,由 format 的精度決定:
    day   → 日曆(年月清單只是下鑽的中繼站)
    month → 月清單,標頭的年可以點開年清單
    year  → 年清單,沒有更上層可去 */
const baseMode = computed(() => {
  const precision = props.calendar.precision.value

  if (precision === 'year') return 'year'
  if (precision === 'month') return 'month'

  return 'date'
})

// 'date' 日曆 | 'year' 年份面板 | 'month' 月份面板
const mode = ref(baseMode.value)

const isPanelMode = computed(() => props.config.headerMode === 'panel')

/* 標頭的月份文字。只到月的精度回空字串 —— 那時月清單本身就是主面板,
  標頭再放一顆「月」按鈕會變成點了沒反應(HeaderPanel 看到空字串就不渲染它)。 */
const monthLabel = computed(() => {
  if (props.calendar.precision.value !== 'day') return ''

  const matched = props.calendar.monthOptions.value.find(
    (item) => Number(item.key) === Number(props.calendar.currMonth.value)
  )

  return matched?.value ?? ''
})

/* 箭頭換的是月還是年,看精度:
    day   → 換月(面板開著時停用,那時畫面上不是日曆)
    month → 換年(月清單一直開著,停用就沒得換年了)
    year  → 年清單本身就列出全部年份,沒有上下頁 */
const onPrev = () => {
  if (props.calendar.precision.value === 'month') {
    props.calendar.onChangeYear(props.calendar.currYear.value - 1)
    return
  }

  props.calendar.onChangeMonth(-1)
}

const onNext = () => {
  if (props.calendar.precision.value === 'month') {
    props.calendar.onChangeYear(props.calendar.currYear.value + 1)
    return
  }

  props.calendar.onChangeMonth(1)
}

/* 換年的界限用 yearOptions 的頭尾判斷 —— 與 onChangeMonthDisabled 同一個依據。
  清單是由大到小排的。

  ⚠️ 這支是「箭頭能不能按」,與 calendar.onYearDisabled(某一年能不能點)不同 ——
      清單裡超出 min / max 的年份仍然列得出來、只是 disabled,所以翻到那裡是允許的。 */
const onYearArrowDisabled = (step) => {
  const years = props.calendar.yearOptions.value
  if (!years.length) return true

  const curr = Number(props.calendar.currYear.value)

  return step > 0 ? curr >= Number(years[0].value) : curr <= Number(years[years.length - 1].value)
}

const onArrowDisabled = (step) => {
  const precision = props.calendar.precision.value

  if (precision === 'year') return true
  if (precision === 'month') return onYearArrowDisabled(step)
  // 日曆精度:面板開著時換月沒有意義
  if (mode.value !== 'date') return true

  return props.calendar.onChangeMonthDisabled(step)
}

/* 對齊 vue-datepicker-next 的層層下鑽:年 → 月 → 日。
  從 header 直接點月份則是 月 → 日,不會多繞一層年。

  ⚠️ 精度停在這一層時,點下去就是「選定」而不是往下鑽 ——
      format 為 YYYY 時點年就結束、YYYY-MM 時點月就結束,
      再往下鑽會選到 format 根本輸出不了的東西。 */
const onSelectYear = (year) => {
  if (props.calendar.precision.value === 'year') {
    emits('selectYMD', { y: year, m: 1, d: 1 })
    return
  }

  props.calendar.onChangeYear(year)
  mode.value = 'month'
}

const onSelectMonth = (month) => {
  if (props.calendar.precision.value === 'month') {
    emits('selectYMD', { y: props.calendar.currYear.value, m: month + 1, d: 1 })
    return
  }

  props.calendar.onSetMonth(month)
  mode.value = 'date'
}

// 收回主面板,而不是一律回日曆 —— 只到月的時候沒有日曆可以回
const onToggle = (target) => {
  mode.value = mode.value === target ? baseMode.value : target
}

// 切回純文字模式時要把面板收掉,否則會卡在沒有 header 可以切回去的狀態
watch(isPanelMode, (value) => {
  if (!value) mode.value = baseMode.value
})

// format 換了(精度跟著變)→ 主面板也要跟著換,否則會停在選不到東西的那一層
watch(baseMode, (value) => {
  mode.value = value
})
</script>

<template>
  <div class="m-datepicker-calendar-container">
    <BuyMDatepickerHeaderPanel
      :year="props.calendar.currYear.value"
      :monthLabel="monthLabel"
      :mode="mode"
      :prevDisabled="onArrowDisabled(-1)"
      :nextDisabled="onArrowDisabled(1)"
      @prev="onPrev"
      @next="onNext"
      @toggle="onToggle"
      v-if="isPanelMode && props.calendar.precision.value !== 'year'"
    />
    <BuyMDatepickerHeaderString
      :label="props.calendar.headerYearMonth.value"
      :prevDisabled="onArrowDisabled(-1)"
      :nextDisabled="onArrowDisabled(1)"
      @prev="onPrev"
      @next="onNext"
      v-else-if="props.calendar.precision.value !== 'year'"
    />

    <BuyMDatepickerPanelYear
      :years="props.calendar.yearOptions.value"
      :current="props.calendar.currYear.value"
      :rangeClassOf="props.calendar.onRangeClassByYear"
      :disabledOf="props.calendar.onYearDisabled"
      @select="onSelectYear"
      v-if="mode === 'year'"
    />
    <BuyMDatepickerPanelMonth
      :months="props.calendar.monthOptions.value"
      :current="props.calendar.currMonth.value"
      :rangeClassOf="props.calendar.onRangeClassByMonth"
      :disabledOf="props.calendar.onMonthDisabled"
      @select="onSelectMonth"
      v-else-if="mode === 'month'"
    />

    <template v-else>
      <div class="m-datepicker-calendar-weeks">
        <div
          class="m-datepicker-calendar-cell"
          v-for="(item, index) in props.calendar.weeks.value"
          :key="`${props.name}_${item.key}_${index}`"
        >
          <span class="m-datepicker-calendar-week">{{ item.value }}</span>
        </div>
      </div>

      <div class="m-datepicker-calendar-dates">
        <div
          class="m-datepicker-calendar-cell"
          v-for="(item, index) in props.calendar.dates.value"
          :key="`${props.name}_${item.date}_${index}`"
        >
          <span
            class="m-datepicker-calendar-ctrl"
            :class="props.calendar.onBindClass(item)"
            v-if="props.calendar.onDateDisabled(item.date)"
          >
            {{ item.day }}
          </span>
          <button
            type="button"
            class="m-datepicker-calendar-ctrl"
            :class="props.calendar.onBindClass(item)"
            @click="emits('select', item.date)"
            v-else
          >
            {{ item.day }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
