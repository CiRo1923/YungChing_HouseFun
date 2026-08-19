<script setup>
/* 時間面板:時 / 分 / 秒的滾動欄。

  ⚠️ 有哪幾欄不是這裡決定的,是 config.format —— 見 .composables/useTimeCore.js。
      format 裡寫 token(hh / mm / ss)的才會變成可選的欄,寫數字字面(00)的
      只是輸出時補上去,不會出現在畫面上。 */

import { computed, nextTick, onMounted, ref, watch } from 'vue'

import {
  onGetTimeOptions,
  onIsTimeDisabled,
  onParseTimeFormat,
} from './.composables/useTimeCore.js'

const props = defineProps({
  format: {
    type: String,
    default: 'hh:mm:ss',
  },
  // { hour, minute, second }
  value: {
    type: Object,
    default: () => ({ hour: 0, minute: 0, second: 0 }),
  },
  step: {
    type: Object,
    default: () => ({ hour: 1, minute: 1, second: 1 }),
  },
  minTime: {
    type: String,
    default: '',
  },
  maxTime: {
    type: String,
    default: '',
  },
})

const emits = defineEmits(['select'])

const listRefs = ref({})

const columns = computed(() =>
  onParseTimeFormat(props.format)
    .parts.filter((part) => part.editable)
    .map((part) => ({
      type: part.type,
      options: onGetTimeOptions(part.type, props.step[part.type]),
    }))
)

// 選了這個值之後會不會超出 min / max
const onDisabled = (type, value) =>
  onIsTimeDisabled(
    { ...props.value, [type]: value },
    { minTime: props.minTime, maxTime: props.maxTime }
  )

/* ⚠️ 用 offsetTop 算而不用 scrollIntoView —— 面板是 Teleport 到 body 的,
    scrollIntoView 會連整個頁面一起捲,面板位置就跑掉了。 */
const onScrollToCurrent = () => {
  nextTick(() => {
    for (const $list of Object.values(listRefs.value)) {
      const $curr = $list?.querySelector('.--curr')
      if (!$list || !$curr) continue

      $list.scrollTop = $curr.offsetTop - $list.clientHeight / 2 + $curr.clientHeight / 2
    }
  })
}

const onSetRef = (type) => (el) => {
  if (el) listRefs.value[type] = el
}

onMounted(onScrollToCurrent)

// 換 format(欄位增減)時重新對位,不然新出現的那欄會停在最上面
watch(() => props.format, onScrollToCurrent)
</script>

<template>
  <div class="m-datepicker-time-container">
    <div class="m-datepicker-time-column" v-for="column in columns" :key="column.type">
      <ul class="m-datepicker-time-list" :ref="onSetRef(column.type)">
        <li class="m-datepicker-time-item" v-for="item in column.options" :key="item.key">
          <button
            type="button"
            class="m-datepicker-time-ctrl"
            :class="{
              '--curr': item.key === props.value[column.type],
              '--disabled': onDisabled(column.type, item.key),
            }"
            :disabled="onDisabled(column.type, item.key)"
            @click="emits('select', column.type, item.key)"
          >
            {{ item.value }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
