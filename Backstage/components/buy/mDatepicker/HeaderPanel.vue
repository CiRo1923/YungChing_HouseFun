<script setup>
/* headerMode: 'panel' —— 年、月各是一顆按鈕,點下去展開對應的面板
  (vue-datepicker-next 的操作方式)。面板本身由 Calendar 決定要不要顯示,
  這裡只負責回報「使用者想切到哪一層」。

  ⚠️ 面板開著的時候左右箭頭要停用 —— 那時畫面上不是日曆,換月沒有意義。 */
const props = defineProps({
  year: {
    type: [Number, String],
    default: null,
  },
  monthLabel: {
    type: String,
    default: '',
  },
  // 'date' | 'year' | 'month'
  mode: {
    type: String,
    default: 'date',
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

defineEmits(['prev', 'next', 'toggle'])
</script>

<template>
  <ul class="m-datepicker-calendar-header">
    <li class="shrink-0">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.prevDisabled || props.mode !== 'date'"
        @click="$emit('prev')"
      >
        <CommonSvgIcon icon="chevron_left" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>

    <li class="m-datepicker-calendar-header-container">
      <div class="flex items-center justify-center gap-x-[8px]">
        <button
          type="button"
          class="m-datepicker-calendar-label"
          :class="{ '--active': props.mode === 'year' }"
          @click="$emit('toggle', 'year')"
        >
          {{ props.year }}
        </button>
        <button
          type="button"
          class="m-datepicker-calendar-label"
          :class="{ '--active': props.mode === 'month' }"
          @click="$emit('toggle', 'month')"
        >
          {{ props.monthLabel }}
        </button>
      </div>
    </li>

    <li class="shrink-0">
      <button
        type="button"
        class="m-datepicker-calendar-arrow"
        :disabled="props.nextDisabled || props.mode !== 'date'"
        @click="$emit('next')"
      >
        <CommonSvgIcon icon="chevron_right" class="m-datepicker-calendar-arrow-icon" />
      </button>
    </li>
  </ul>
</template>
