<script setup>
import '@css/_modules/buy/mTab/variables.css'
import '@css/_modules/buy/mTab/checkVariables.css'
import '@css/_modules/buy/mTab/common.css'
import '@css/_modules/buy/mTab/check.css'

const props = defineProps({
  options: {
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
const activeIndex = ref(0)
// 切換動畫用
const rafId = ref(null)
const prevIndex = ref(null)
const direction = ref(null)
const animating = ref(null)
const isShowItem = ref(false)

const config = computed(() => {
  return {
    active: 0,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    header: '',
    headerItem: '',
    anchor: '',
    body: '',
    ...props.setClass,
  }
})

const onHeaderAs = (item) => {
  const { to, href } = item

  return href ? 'a' : to ? 'router-link' : 'button'
}

const onHeaderBind = (item) => {
  const as = onHeaderAs(item)
  const { to, href, target } = item

  return as === 'router-link'
    ? {
        to: to,
        ...(target
          ? {
              target,
              rel: 'noopener',
            }
          : {}),
      }
    : as === 'a'
      ? {
          href: href,
          target: '_blank',
          rel: 'noopener',
        }
      : {
          type: as,
        }
}

const onInit = async () => {
  const { active } = config.value
  activeIndex.value = active
  // prevIndex.value = active
}

const onStartAnimate = () => {
  onCancelAnimationFram()

  // 先清掉 animating，確保是「無 transition 的初始狀態」
  animating.value = null

  // 下一個 frame 再開啟 transition
  rafId.value = requestAnimationFrame(() => {
    animating.value = '--animating'
    rafId.value = null

    if (!direction.value) {
      onReset()
    }
  })
}

const onClick = async (item, index) => {
  const { href, to } = item
  const isURL = !!(href || to)

  if (isURL) return
  if (isShowItem.value) return
  // if (prevIndex.value === activeIndex.value) return

  prevIndex.value = activeIndex.value // 儲存上一次點擊的 activeIndex
  activeIndex.value = index
  direction.value =
    activeIndex.value > prevIndex.value
      ? '--left'
      : activeIndex.value < prevIndex.value
        ? '--right'
        : null
  isShowItem.value = direction.value ? true : false

  await nextTick()
  onStartAnimate()
}

//  動畫結束
const onTrackTransitionEnd = async (e) => {
  if (e.propertyName !== 'transform') return
  if (!isShowItem.value) return

  onReset()
}

const onCancelAnimationFram = () => {
  if (rafId.value != null) cancelAnimationFrame(rafId.value)
}

const onReset = () => {
  animating.value = null
  direction.value = null
  isShowItem.value = false
  prevIndex.value = null
}

onUnmounted(() => {
  onCancelAnimationFram()
})

onMounted(() => {
  onInit()
})
</script>

<template>
  <div class="m-tab --check" :class="setClass.main">
    <ul class="m-tab-header" :class="setClass.header">
      <li
        class="m-tab-header-item"
        :class="[{ '--active': index === activeIndex }, setClass.headerItem]"
        v-for="(item, index) in props.options"
        :key="`tab_header_${item.label}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor"
          :class="setClass.anchor"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index)"
        >
          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-tab-check-anchor-icon"
            v-if="index === activeIndex"
          />
          <slot name="header" :item="item" :index="index">
            <b class="m-tab-anchor-text">{{ item.label }}</b>
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body" :class="setClass.body">
      <div class="m-table-body-content">
        <ul
          class="m-tab-body-items"
          :class="[animating, direction]"
          @transitionend="onTrackTransitionEnd"
        >
          <template v-for="(item, index) in props.options" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item"
              v-if="!item.href && (index === activeIndex || (isShowItem && index === prevIndex))"
            >
              <slot :name="`content_${index}`" :index="index" />
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
