<script setup>
/* 日曆面板本體:header + 星期列 + 日期格。
  header 依 config.headerMode 換一支元件('string' 純文字 / 'panel' 點年月展開面板),
  面板模式下年、月各自是獨立元件,要改哪一種就只動那一支。

  ⚠️ 這支只負責畫面 —— 日期狀態全在 props.calendar(useCalendar 的實例)裡,
      由 Single 建立後傳進來,選了哪天用 emit 回報。 */

import { computed, ref, watch } from 'vue'

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

const emits = defineEmits(['select'])

// 'date' 日曆 | 'year' 年份面板 | 'month' 月份面板
const mode = ref('date')

const isPanelMode = computed(() => props.config.headerMode === 'panel')

const monthLabel = computed(() => {
  const matched = props.calendar.monthOptions.value.find(
    (item) => Number(item.key) === Number(props.calendar.currMonth.value)
  )

  return matched?.value ?? ''
})

/* 對齊 vue-datepicker-next 的層層下鑽:年 → 月 → 日。
  從 header 直接點月份則是 月 → 日,不會多繞一層年。 */
const onSelectYear = (year) => {
  props.calendar.onChangeYear(year)
  mode.value = 'month'
}

const onSelectMonth = (month) => {
  props.calendar.onSetMonth(month)
  mode.value = 'date'
}

const onToggle = (target) => {
  mode.value = mode.value === target ? 'date' : target
}

// 切回純文字模式時要把面板收掉,否則會卡在沒有 header 可以切回去的狀態
watch(isPanelMode, (value) => {
  if (!value) mode.value = 'date'
})
</script>

<template>
  <div class="m-datepicker-calendar-container">
    <BuyMDatepickerHeaderPanel
      :year="props.calendar.currYear.value"
      :monthLabel="monthLabel"
      :mode="mode"
      :prevDisabled="props.calendar.onChangeMonthDisabled(-1)"
      :nextDisabled="props.calendar.onChangeMonthDisabled(1)"
      @prev="props.calendar.onChangeMonth(-1)"
      @next="props.calendar.onChangeMonth(1)"
      @toggle="onToggle"
      v-if="isPanelMode"
    />
    <BuyMDatepickerHeaderString
      :label="props.calendar.headerYearMonth.value"
      :prevDisabled="props.calendar.onChangeMonthDisabled(-1)"
      :nextDisabled="props.calendar.onChangeMonthDisabled(1)"
      @prev="props.calendar.onChangeMonth(-1)"
      @next="props.calendar.onChangeMonth(1)"
      v-else
    />

    <BuyMDatepickerPanelYear
      :years="props.calendar.yearOptions.value"
      :current="props.calendar.currYear.value"
      @select="onSelectYear"
      v-if="mode === 'year'"
    />
    <BuyMDatepickerPanelMonth
      :months="props.calendar.monthOptions.value"
      :current="props.calendar.currMonth.value"
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
