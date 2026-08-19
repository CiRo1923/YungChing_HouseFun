<script setup>
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

defineEmits(['prev', 'next'])
</script>

<template>
  <ul class="m-datepicker-calendar-header">
    <li class="shrink-0">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.prevDisabled"
        @click="$emit('prev')"
      >
        <CommonSvgIcon icon="chevron_left" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>

    <li class="m-datepicker-calendar-header-container">
      <span class="block text-center">{{ props.label }}</span>
    </li>

    <li class="shrink-0">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.nextDisabled"
        @click="$emit('next')"
      >
        <CommonSvgIcon icon="chevron_right" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>
  </ul>
</template>
