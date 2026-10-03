<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */
import './.css/variables.css'
import './.css/common.css'

import { onDeepMerge } from '@js/_prototype.js'

const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
  config: {
    type: Object,
    default: () => {},
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})
const mainRef = ref(null)
const containerRef = ref(null)
const containerRefElement = computed(() => containerRef.value?.container)
const config = computed(() => {
  const defaultConfig = {
    as: null,
    header: {
      label: '',
      icon: null,
    },
    childrenUseRootClass: false,
  }

  return onDeepMerge(defaultConfig, props.config)
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    label: '',
    ...props.setClass,
  }
})

defineExpose({
  item: mainRef,
  container: containerRefElement,
})
</script>

<template>
  <div class="m-item" :class="setClass.main" ref="mainRef">
    <div class="m-item-header" :class="setClass.header" v-if="config.header.label">
      <p class="m-item-header-text">
        <b class="m-item-header-label" :class="setClass.label">
          {{ config.header.label }}
        </b>
      </p>
    </div>
    <BuyMItemContainer
      :data="props.data"
      :setClass="props.setClass"
      :config="config"
      ref="containerRef"
    />
  </div>
</template>
