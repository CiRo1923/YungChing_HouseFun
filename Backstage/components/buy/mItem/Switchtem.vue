<script setup>
import Item from '@components/buy/mItem/Main.vue'

import { onDevice, deepMerge } from '@js/_prototype.js'

import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: null,
  },
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
const device = ref(null)
const bodyRef = ref(null)
const containerRef = ref(null)
const itemRef = ref(null)
const isActive = ref(false)
const maskHeight = computed(() => {
  const { container } = itemRef.value
  const firstElement = container.firstElementChild
  const itemLineHeight = parseFloat(getComputedStyle(firstElement).lineHeight, 10)

  return itemLineHeight
})
const mask = computed(() => {
  const { hasMask } = props.config || {}
  const defaultValue = false
  const isObject = !!(hasMask !== undefined && typeof hasMask === 'object')

  return {
    p: !isObject
      ? hasMask !== undefined
        ? hasMask
        : defaultValue
      : hasMask.pt !== undefined
        ? hasMask.pt
        : hasMask.p !== undefined
          ? hasMask.p
          : defaultValue,
    t: !isObject
      ? hasMask !== undefined
        ? hasMask
        : defaultValue
      : hasMask.pt !== undefined
        ? hasMask.pt
        : hasMask.tm !== undefined
          ? hasMask.tm
          : hasMask.t !== undefined
            ? hasMask.t
            : defaultValue,
    m: !isObject
      ? hasMask !== undefined
        ? hasMask
        : defaultValue
      : hasMask.tm !== undefined
        ? hasMask.tm
        : hasMask.m !== undefined
          ? hasMask.m
          : defaultValue,
  }
})
const config = computed(() => {
  const excludeKeys = ['hasMask']
  const defaultConfig = {
    maskRows: 1,
  }
  const propsConfig = () => {
    const result = {}

    for (const key in props.config) {
      if (excludeKeys.indexOf(key) === -1) {
        result[key] = props.config[key]
      }
    }

    return result
  }

  return deepMerge(defaultConfig, propsConfig(), {
    hasMask: mask.value,
  })
})
const hasMatchDevice = computed(() => mask.value[device.value])
const setClass = computed(() => {
  return {
    main: '',
    header: '',
    body: '',
    container: '',
    item: {},
    action: '',
    ...props.setClass,
  }
})

const onToggleMaskHeight = () => {
  const { maskRows } = config.value
  const { item } = itemRef.value
  const itemRect = item.getBoundingClientRect()
  const containerStyle = window.getComputedStyle(containerRef.value)
  const containerMargin = {
    top: parseFloat(containerStyle.marginTop, 10),
    bottom: parseFloat(containerStyle.marginBottom, 10),
  }
  const containerPadding = {
    top: parseFloat(containerStyle.paddingTop, 10),
    bottom: parseFloat(containerStyle.paddingBottom, 10),
  }
  const defaultHeight =
    containerMargin.top + containerMargin.bottom + containerPadding.top + containerPadding.bottom
  const totalHeight = itemRect.height + defaultHeight

  if (hasMatchDevice.value) {
    if (!isActive.value) {
      bodyRef.value.style.maxHeight = maskRows
        ? itemRef.value && maskHeight.value
          ? `${maskHeight.value * maskRows + defaultHeight}px`
          : `${totalHeight}px`
        : maskRows
    } else {
      bodyRef.value.style.maxHeight = `${totalHeight}px`
    }
  } else {
    bodyRef.value.style.maxHeight = null
  }
}

const onAnchorClick = () => {
  isActive.value = !isActive.value

  onToggleMaskHeight()
}

const onResize = () => {
  device.value = onDevice()

  onToggleMaskHeight()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-switch-item" :class="setClass.main">
    <button
      type="button"
      class="m-switch-item-header flex w-full items-center text-left"
      :class="setClass.header"
      v-if="props.label || hasMatchDevice"
      @click="onAnchorClick"
    >
      <p class="grow">{{ props.label }}</p>
      <i
        class="m-switch-item-icon relative flex h-[16px] w-[16px] shrink-0 items-center justify-center"
        :class="{ '--active': isActive }"
        v-if="hasMatchDevice"
      />
    </button>
    <div
      class="m-switch-item-body overflow-hidden transition-heights duration-300"
      :class="setClass.body"
      ref="bodyRef"
    >
      <div
        class="m-switch-item-container relative"
        :class="[{ '--has-mask': !isActive && hasMatchDevice }, setClass.container]"
        ref="containerRef"
      >
        <Item :data="props.data" :config="props.config" :setClass="setClass.item" ref="itemRef" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.m-switch-item-icon {
  &:before,
  &:after {
    @apply absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[--white] content-default;
  }

  &:before {
    @apply h-[1px] w-[14px];
  }

  &:after {
    @apply w-[1px] overflow-hidden transition-heights duration-300;
  }

  &:not(.\-\-active) {
    &:after {
      @apply h-[14px];
    }
  }

  &.\-\-active {
    &:after {
      @apply h-0;
    }
  }
}
</style>
