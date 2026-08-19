<script setup>
// 年份面板。headerMode: 'panel' 時點年份會展開這個。
import { nextTick, onMounted, ref } from 'vue'

const props = defineProps({
  years: {
    type: Array,
    default: () => [],
  },
  current: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['select'])

const listRef = ref(null)

/* ⚠️ 年份清單通常上百筆(1911 起跳),不捲到選中的那年等於每次都要自己滑很久。
    用 offsetTop 算而不用 scrollIntoView —— 後者會連帶把整個頁面捲動,
    面板是 Teleport 到 body 的,一捲位置就跑掉了。 */
onMounted(() => {
  nextTick(() => {
    const $list = listRef.value
    const $curr = $list?.querySelector('.--curr')
    if (!$list || !$curr) return

    $list.scrollTop = $curr.offsetTop - $list.clientHeight / 2 + $curr.clientHeight / 2
  })
})
</script>

<template>
  <ul class="m-datepicker-panel --year" ref="listRef">
    <li class="m-datepicker-panel-item" v-for="item in props.years" :key="item.value">
      <button
        type="button"
        class="m-datepicker-panel-ctrl"
        :class="{ '--curr': Number(item.value) === Number(props.current) }"
        @click="$emit('select', item.value)"
      >
        {{ item.value }}
      </button>
    </li>
  </ul>
</template>
