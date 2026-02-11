<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

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

const onHeaderBind = (item, index) => {
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
    <ul class="m-tab-header flex gap-x-[8px]" :class="setClass.header">
      <li
        class="m-tab-header-item flex items-center"
        :class="[{ '--active': index === activeIndex }, setClass.headerItem]"
        v-for="(item, index) in props.options"
        :key="`tab_header_${item.label}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor flex w-full items-center justify-center gap-x-[4px] rounded-t-[15px] px-[9px] py-[8px] text-[16px] transition-colors duration-300"
          :class="setClass.anchor"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index)"
        >
          <SvgIcon icon="icon_check_solid" class="h-[16px] w-[16px]" v-if="index === activeIndex" />
          <slot name="header" :item="item" :index="index">
            <b class="font-semibold">{{ item.label }}</b>
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body border-t-[4px] border-t-[--orange-e646]" :class="setClass.body">
      <div
        class="m-table-body-content overflow-hidden rounded-b-[15px] border-transparent bg-[--white]"
      >
        <ul
          class="m-tab-body-items flex w-[200%] will-change-transform"
          :class="[animating, direction]"
          @transitionend="onTrackTransitionEnd"
        >
          <template v-for="(item, index) in props.options" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item w-1/2 flex-shrink-0"
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

<style src="@css/_modules/buy/mTab.css"></style>
<style lang="postcss">
.m-tab {
  &.\-\-check {
    .m-tab-header-item {
      &:not(.\-\-active) {
        .m-tab-anchor {
          @apply bg-[--white] text-[--gray-666];
        }
      }

      &.\-\-active {
        .m-tab-anchor {
          @apply bg-[--orange-e646] text-[--white];
        }
      }
    }

    .m-tab-body-items {
      &.\-\-animating {
        @apply transition-transform duration-300;

        &.\-\-left {
          @apply -translate-x-1/2;
        }

        &.\-\-right {
          @apply translate-x-0;
        }
      }

      &.\-\-right {
        @apply -translate-x-1/2;
      }
    }
  }
}
</style>
