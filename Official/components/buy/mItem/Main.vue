<script setup>
import ItemContainer from '@components/buy/mItem/Container.vue'

import { onDeepMerge } from '@js/_prototype.js'

import { computed, ref } from 'vue'

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
    <div :class="setClass.header" v-if="config.header.label">
      <p class="inline-flex m:text-[13px] pt:text-[14px]">
        <b class="grow font-medium" :class="setClass.label">
          {{ config.header.label }}
        </b>
      </p>
    </div>
    <ItemContainer
      :data="props.data"
      :setClass="props.setClass"
      :config="config"
      ref="containerRef"
    />
  </div>
</template>

<style></style>
