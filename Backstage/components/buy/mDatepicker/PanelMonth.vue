<script setup>
// 月份面板。headerMode: 'panel' 時點月份會展開這個。
const props = defineProps({
  months: {
    type: Array,
    default: () => [],
  },
  // 0-11,對齊 Date 的 getMonth()
  current: {
    type: [Number, String],
    default: null,
  },
  rangeClassOf: {
    type: Function,
    default: () => [],
  },
  // 這一格超出 min / max 沒有?整月都在範圍外才會是 true(由 useCalendar 判斷)
  disabledOf: {
    type: Function,
    default: () => false,
  },
})

/* 區間選擇時,這一格要標哪些 class(--range-start / --in-range / --range-end)。
  由 useCalendar 算好傳進來 —— 這支只負責畫,不知道區間是什麼。 */
defineEmits(['select'])
</script>

<template>
  <ul class="m-datepicker-panel --month">
    <li class="m-datepicker-panel-item" v-for="item in props.months" :key="item.key">
      <button
        type="button"
        class="m-datepicker-panel-ctrl"
        :class="[
          props.rangeClassOf(item.key),
          { '--curr': Number(item.key) === Number(props.current) },
          { '--disabled': props.disabledOf(item.key) },
        ]"
        :disabled="props.disabledOf(item.key)"
        @click="$emit('select', item.key)"
      >
        {{ item.value }}
      </button>
    </li>
  </ul>
</template>
