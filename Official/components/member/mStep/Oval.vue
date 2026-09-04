<script setup>
import '@css/_modules/member/mStep/variables.css'
import '@css/_modules/member/mStep/ovalVariables.css'
import '@css/_modules/member/mStep/common.css'
import '@css/_modules/member/mStep/oval.css'

const props = defineProps({
  // 每一步的 { icon, text } —— 步驟的內容與數量都由使用端決定
  items: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    // 目前進行到第幾步
    step: 1,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    // 字級由使用端決定 —— 這支到處複用,module 不定 text-*
    label: '',
    ...props.setClass,
  }
})

const onIsDone = (index) => index + 1 <= config.value.step
</script>

<template>
  <ul class="m-step --oval">
    <!-- 步驟之間的箭頭由 .m-step-item::before 畫,不另外放節點 -->
    <li
      class="m-step-item"
      :class="{
        '--done': onIsDone(index),
      }"
      v-for="(item, index) in props.items"
      :key="item.text"
    >
      <CommonSvgIcon :icon="item.icon" class="m-step-icon" />
      <em class="m-step-label" :class="setClass.label">{{ item.text }}</em>
    </li>
  </ul>
</template>
