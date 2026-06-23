<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
const props = defineProps({
  label: {
    type: String,
    default: null,
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
    as: 'button',
    events: 'hover', // 'hover' | 'click' | 'hover, click' | {p: 'hover' | 'click' | 'hover, click', pt: 'hover' | 'click' | 'hover, click', tm: 'hover' | 'click' | 'hover, click', t: 'hover' | 'click' | 'hover, click', m: 'hover' | 'click' | 'hover, click'}
    position: 'center, top', // 'center, top' | 'center, bottom' | 'left, top' | 'left, bottom' | 'left, center' | 'right, top' | 'right, bottom' | 'right, center'（可改為依裝置設定的物件 {p, pt, tm, t, m}）
    icon: null,
    ...props.config,
  }
})

// device 只會回傳 p | t | m，透過 onResolveByDevice 解析 pt / tm 區間設定
const events = computed(() => {
  const value = onResolveByDevice(config.value.events, device.value) || ''

  return value
    .split(',')
    .map((event) => event.trim())
    .filter(Boolean)
})

const position = computed(() => {
  const value = onResolveByDevice(config.value.position, device.value) || 'center, top'
  const [align, side] = value.split(',').map((item) => item.trim())

  return { align, side }
})

const hasHover = computed(() => events.value.includes('hover'))
const hasClick = computed(() => events.value.includes('click'))

// config.icon 可傳物件 { name, position } 直接使用；若只傳字串則組成 { name: 'xxx', position: 'right' }，position 預設 right
const icon = computed(() => {
  const value = config.value.icon

  if (!value) return null

  if (typeof value === 'object') {
    return { name: null, position: 'right', ...value }
  }

  return { name: value, position: 'right' }
})

const setClass = computed(() => {
  return {
    main: '',
    label: '',
    icon: '',
    container: '',
    ...props.setClass,
  }
})

// 觸發節點要綁定的屬性，集中於此方便日後擴充（disabled / href / aria-* …）
const bind = computed(() => {
  const isButton = config.value.as === 'button'
  if (isButton) return { type: 'button' }

  return {}
})

const tooltipRef = ref(null)
const containerRef = ref(null)
const isOpen = ref(false)
const floatingStyle = ref({})

// 以觸發點的 getBoundingClientRect 計算 fixed 座標，避免被父層 overflow:hidden 裁切
const onUpdatePosition = () => {
  const $root = tooltipRef.value
  const $container = containerRef.value
  if (!$root || !$container) return

  const { align, side } = position.value
  const trigger = $root.getBoundingClientRect()
  const tooltip = $container.getBoundingClientRect()

  // ::after 箭頭為 absolute，不含在 getBoundingClientRect 內，需把箭頭尺寸另外算進間距（直接讀 computed border 寬度，CSS 改尺寸會同步）
  const after = getComputedStyle($container, '::after')
  const arrowH =
    (parseFloat(after.borderTopWidth) || 0) + (parseFloat(after.borderBottomWidth) || 0)
  const arrowW =
    (parseFloat(after.borderLeftWidth) || 0) + (parseFloat(after.borderRightWidth) || 0)

  // margin 不含在 getBoundingClientRect，且 fixed 元素設了 top/left 後 margin 會再位移 border box，故間距 = 箭頭 + margin，最後再扣回 margin 位移
  const containerStyle = getComputedStyle($container)
  const mTop = parseFloat(containerStyle.marginTop) || 0
  const mRight = parseFloat(containerStyle.marginRight) || 0
  const mBottom = parseFloat(containerStyle.marginBottom) || 0
  const mLeft = parseFloat(containerStyle.marginLeft) || 0

  // 先算目標 border-box 位置（含 箭頭 + margin 間距）
  let boxTop = 0
  let boxLeft = 0

  if (side === 'top') {
    boxTop = trigger.top - tooltip.height - arrowH - mBottom
  } else if (side === 'center') {
    boxTop = trigger.top + trigger.height / 2 - tooltip.height / 2
  } else {
    boxTop = trigger.bottom + arrowH + mTop
  }

  if (align === 'left') {
    // side center：tooltip 擺左側，需扣掉自身寬度 + 箭頭 + margin；否則為左緣對齊
    boxLeft = side === 'center' ? trigger.left - tooltip.width - arrowW - mRight : trigger.left
  } else if (align === 'right') {
    // side center：tooltip 擺右側，加上箭頭 + margin；否則為右緣對齊
    boxLeft = side === 'center' ? trigger.right + arrowW + mLeft : trigger.right - tooltip.width
  } else {
    boxLeft = trigger.left + trigger.width / 2 - tooltip.width / 2
  }

  // top/left 設定值需扣掉 margin，渲染後 border box 才會落在目標位置
  floatingStyle.value = {
    position: 'fixed',
    top: `${boxTop - mTop}px`,
    left: `${boxLeft - mLeft}px`,
  }
}

const onOpen = async () => {
  isOpen.value = true
  await nextTick()
  onUpdatePosition()
}

const onClose = () => {
  isOpen.value = false
}

const onMouseEnter = () => {
  if (hasHover.value) onOpen()
}

const onMouseLeave = () => {
  if (hasHover.value) onClose()
}

const onClick = () => {
  if (!hasClick.value) return

  if (isOpen.value) {
    onClose()
  } else {
    onOpen()
  }
}

const onOutside = (e) => {
  if (!hasClick.value || !isOpen.value) return

  const $root = tooltipRef.value
  const $container = containerRef.value
  const target = e.target

  if ($root?.contains(target) || $container?.contains(target)) return

  onClose()
}

const onReposition = () => {
  if (isOpen.value) onUpdatePosition()
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
  document.addEventListener('click', onOutside, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  document.removeEventListener('click', onOutside, true)
})
</script>

<template>
  <component
    :is="config.as"
    v-bind="bind"
    class="m-tooltip inline-flex items-center transition-colors duration-300"
    :class="setClass.main"
    ref="tooltipRef"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <CommonSvgIcon
      :icon="icon.name"
      :class="setClass.icon"
      v-if="icon && icon.position === 'left'"
    />
    <em class="m-tooltip-label" :class="setClass.label" v-if="props.label">{{ props.label }}</em>
    <CommonSvgIcon
      :icon="icon.name"
      :class="setClass.icon"
      v-if="icon && icon.position === 'right'"
    />
  </component>
  <Teleport to="body">
    <Transition name="tooltip" appear>
      <div
        class="m-tooltip-container"
        :class="[`--${position.align}-x`, `--${position.side}-y`, setClass.container]"
        :style="floatingStyle"
        ref="containerRef"
        v-if="isOpen"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      >
        <slot name="content" />
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="postcss">
:root {
  --tooltip-pc-rounded: 3px;
  --tooltip-tablet-rounded: 3px;
  --tooltip-mobile-rounded: 3px;

  --tooltip-container-pc-m: 2px;
  --tooltip-container-tablet-m: 2px;
  --tooltip-container-mobile-m: 2px;

  --tooltip-container-pc-px: 6px;
  --tooltip-container-tablet-px: 6px;
  --tooltip-container-mobile-px: 6px;

  --tooltip-container-pc-py: 2px;
  --tooltip-container-tablet-py: 2px;
  --tooltip-container-mobile-py: 2px;

  --tooltip-container-pc-rounded: 3px;
  --tooltip-container-tablet-rounded: 3px;
  --tooltip-container-mobile-rounded: 3px;

  --tooltip-container-pc-shadow: none;
  --tooltip-container-tablet-shadow: none;
  --tooltip-container-mobile-shadow: none;

  --tooltip-container-arrow-pc-size: 5px;
  --tooltip-container-arrow-tablet-size: 5px;
  --tooltip-container-arrow-mobile-size: 5px;

  --tooltip-container-text: var(--white);
  --tooltip-container-bg-color: var(--gray-333);
}

.m-tooltip {
  @apply rounded-[--tooltip-rounded];

  &.\-\-bg-hexa-75-gray-333 {
    @apply bg-hexa-[--gray-333,0.75];

    &:hover {
      @apply bg-[--gray-333];
    }
  }

  &.\-\-text-white {
    @apply text-[--white];
  }
}

.m-tooltip-container {
  box-shadow: var(--tooltip-container-shadow);
  /* 基底先 fixed，避免第一次開啟時為 static block（寬度撐滿 viewport）導致量測 width 錯誤、定位偏移 */
  @apply fixed left-0 top-0 z-[3] m-[--tooltip-container-m] rounded-[--tooltip-container-rounded] bg-[--tooltip-container-bg-color] px-[--tooltip-container-px] py-[--tooltip-container-py] text-[--tooltip-container-text];

  /* 指向觸發點的小箭頭 */
  &::after {
    border-width: var(--tooltip-container-arrow-size);

    @apply absolute h-0 w-0 border-solid border-transparent content-default;
  }

  /* y 軸：tooltip 在觸發點上方，箭頭朝下 */
  &.--top-y::after {
    @apply top-full border-b-0 border-t-[--tooltip-container-bg-color];
  }

  /* y 軸：tooltip 在觸發點下方，箭頭朝上 */
  &.--bottom-y::after {
    @apply bottom-full border-t-0 border-b-[--tooltip-container-bg-color];
  }

  /* x 軸：箭頭水平位置（套用於 top-y / bottom-y） */
  &.--left-x::after {
    @apply left-[16px];
  }

  &.--center-x::after {
    @apply left-1/2 -translate-x-1/2;
  }

  &.--right-x::after {
    @apply right-[16px];
  }

  /* y 軸置中：tooltip 與觸發點垂直對齊，箭頭改為朝左 / 右 */
  &.--center-y::after {
    @apply top-1/2 -translate-y-1/2;
  }

  /* tooltip 在觸發點左側：箭頭在右緣朝右 */
  &.--center-y.--left-x::after {
    @apply left-full right-auto translate-x-0 border-r-0 border-l-[--tooltip-container-bg-color];
  }

  /* tooltip 在觸發點右側：箭頭在左緣朝左 */
  &.--center-y.--right-x::after {
    @apply left-auto right-full translate-x-0 border-l-0 border-r-[--tooltip-container-bg-color];
  }
}

@screen p {
  .m-tooltip {
    --tooltip-rounded: var(--tooltip-pc-rounded);

    &.\-\-px-6,
    &.p\:\-\-px-6,
    &.pt\:\-\-px-6 {
      @apply px-[6px];
    }

    &.\-\-h-24,
    &.p\:\-\-h-24,
    &.pt\:\-\-h-24 {
      @apply h-[24px];
    }
  }

  .m-tooltip-container {
    --tooltip-container-m: var(--tooltip-container-pc-m);
    --tooltip-container-px: var(--tooltip-container-pc-px);
    --tooltip-container-py: var(--tooltip-container-pc-py);
    --tooltip-container-rounded: var(--tooltip-container-pc-rounded);
    --tooltip-container-shadow: var(--tooltip-container-pc-shadow);
    --tooltip-container-arrow-size: var(--tooltip-container-arrow-pc-size);
  }
}

@screen t {
  .m-tooltip {
    --tooltip-rounded: var(--tooltip-tablet-rounded);

    &.\-\-px-6,
    &.pt\:\-\-px-6,
    &.tm\:\-\-px-6,
    &.t\:\-\-px-6 {
      @apply px-[6px];
    }

    &.\-\-h-24,
    &.pt\:\-\-h-24,
    &.tm\:\-\-h-24,
    &.t\:\-\-h-24 {
      @apply h-[24px];
    }
  }

  .m-tooltip-container {
    --tooltip-container-m: var(--tooltip-container-tablet-m);
    --tooltip-container-px: var(--tooltip-container-tablet-px);
    --tooltip-container-py: var(--tooltip-container-tablet-py);
    --tooltip-container-rounded: var(--tooltip-container-tablet-rounded);
    --tooltip-container-shadow: var(--tooltip-container-tablet-shadow);
    --tooltip-container-arrow-size: var(--tooltip-container-arrow-tablet-size);
  }
}

@screen m {
  .m-tooltip {
    --tooltip-rounded: var(--tooltip-mobile-rounded);

    &.\-\-px-6,
    &.tm\:\-\-px-6,
    &.m\:\-\-px-6 {
      @apply px-[6px];
    }

    &.\-\-h-24,
    &.tm\:\-\-h-24,
    &.m\:\-\-h-24 {
      @apply h-[24px];
    }
  }

  .m-tooltip-container {
    --tooltip-container-m: var(--tooltip-container-mobile-m);
    --tooltip-container-px: var(--tooltip-container-mobile-px);
    --tooltip-container-py: var(--tooltip-container-mobile-py);
    --tooltip-container-rounded: var(--tooltip-container-mobile-rounded);
    --tooltip-container-shadow: var(--tooltip-container-mobile-shadow);
    --tooltip-container-arrow-size: var(--tooltip-container-arrow-mobile-size);
  }
}
</style>
