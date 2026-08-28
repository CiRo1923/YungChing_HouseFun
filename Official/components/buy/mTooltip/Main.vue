<script setup>
import '@css/_modules/buy/mTooltip/variables.css'
import '@css/_modules/buy/mTooltip/common.css'

import { onResolveByDevice } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
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
    class="m-tooltip"
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
