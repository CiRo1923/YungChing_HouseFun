<script setup>
import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

// headerMode: 'string' —— 年月只顯示文字(2026-08),換月靠左右箭頭。
const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  prevDisabled: {
    type: Boolean,
    default: false,
  },
  nextDisabled: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['prev', 'next'])

const onPrev = () => {
  emits('prev')
}
const onNext = () => {
  emits('next')
}
</script>

<template>
  <ul class="m-datepicker-calendar-header">
    <li class="m-datepicker-calendar-header-side">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.prevDisabled"
        @click="onPrev"
      >
        <CommonMSvgIcon icon="chevron_left" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>

    <li class="m-datepicker-calendar-header-container">
      <span class="m-datepicker-calendar-header-text">{{ props.label }}</span>
    </li>

    <li class="m-datepicker-calendar-header-side">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.nextDisabled"
        @click="onNext"
      >
        <CommonMSvgIcon icon="chevron_right" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>
  </ul>
</template>
