<script setup>
/* headerMode: 'panel' —— 年、月各是一顆按鈕,點下去展開對應的面板
  (vue-datepicker-next 的操作方式)。面板本身由 Calendar 決定要不要顯示,
  這裡只負責回報「使用者想切到哪一層」。

  ⚠️ 箭頭要不要停用**完全由 prevDisabled / nextDisabled 決定**,這裡不自己判斷 ——
      箭頭換的是月還是年、面板開著算不算有意義,都要看 format 的精度,
      而精度只有 Calendar 知道(只到月時月清單一直開著,箭頭換的是年,不該停用)。

  ⚠️ monthLabel 空字串時不渲染月按鈕 —— 只到月的精度沒有「月」可以再往下切。 */
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
    <li class="m-datepicker-calendar-header-side">
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
      <div class="m-datepicker-calendar-header-group">
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
          v-if="props.monthLabel"
        >
          {{ props.monthLabel }}
        </button>
      </div>
    </li>

    <li class="m-datepicker-calendar-header-side">
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
