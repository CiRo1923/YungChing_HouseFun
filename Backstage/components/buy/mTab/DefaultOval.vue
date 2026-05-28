<script setup>
import { onDeepMerge } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const route = useRoute()

const emit = defineEmits(['click'])
const props = defineProps({
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

const activeIndex = ref(null)
// 切換動畫用
const rafId = ref(null)
const prevIndex = ref(null)
const direction = ref(null)
const animating = ref(null)
const isShowItem = ref(false)
const isDeviceM = computed(() => device.value === 'm')

const config = computed(() => {
  const defaultConfig = {
    active: null,
    containerMode: 'multiple', // 'multiple' / 'single' / false
    icon: {
      name: null,
      show: 'active', // 'active' / 'all'
    },
    schema: {
      id: 'id',
      label: 'label',
    },
  }
  return onDeepMerge(defaultConfig, props.config)
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

  if (active !== null) {
    activeIndex.value = active
  } else {
    const { name } = route
    const index = props.items.findIndex((item) => (item.to ? item.to.name === name : null))

    if (index !== -1) {
      activeIndex.value = index
    }
  }
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

const onClick = async (item, index, event) => {
  const { href, to } = item
  const { containerMode } = config.value
  const isURL = !!(href || to)
  const isSingle = containerMode === 'single'
  const isMultiple = containerMode === 'multiple'

  emit('click', {
    item,
    index,
    event,
  })

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

  if (isSingle) {
    onReset()
  }

  if (isMultiple) {
    onStartAnimate()
  }
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

// 執行
onInit()

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  onCancelAnimationFram()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-tab --default-oval" :class="setClass.main">
    <ul class="m-tab-header relative flex gap-x-[8px] pb-[1px]" :class="setClass.header">
      <li
        class="m-tab-header-item flex items-center"
        :class="setClass.headerItem"
        v-for="(item, index) in props.items"
        :key="`tab_header_${item[config.schema.id]}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor flex w-full items-center justify-center rounded-t-[15px] text-[16px] transition-colors duration-300 t:gap-x-[4px] p:gap-x-[8px]"
          :class="[
            {
              '--active': index === activeIndex,
              '--icon-active': config.icon.show === 'active',
            },
            setClass.anchor,
          ]"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index, $event)"
        >
          <CommonSvgIcon
            :icon="config.icon.name || item.icon"
            class="m-tab-icon h-[18px] w-[18px] overflow-hidden transition-all duration-300 m:hidden"
            v-if="!isDeviceM && (config.icon.name || item.icon)"
          />
          <slot name="header" :item="item" :index="index">
            <em class="m-tab-anchor-text" v-html="item[config.schema.label]" />
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body relative z-[1]" :class="setClass.body" v-if="config.containerMode">
      <div class="m-table-body-content overflow-hidden border-transparent">
        <!-- 單一區塊 -->
        <ul class="m-tab-body-items" v-if="config.containerMode === 'single'">
          <li class="m-tab-body-item">
            <slot />
          </li>
        </ul>
        <!-- 多個區塊 -->
        <ul
          class="m-tab-body-items flex w-[200%] will-change-transform"
          :class="[animating, direction]"
          @transitionend="onTrackTransitionEnd"
          v-if="config.containerMode === 'multiple'"
        >
          <template v-for="(item, index) in props.items" :key="`tab_body_${item.label}_${index}`">
            <li
              class="m-tab-body-item w-1/2 shrink-0"
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
  &.\-\-default-oval {
    &.\-\-orange-e646 {
      .m-tab-header {
        &:after {
          @apply bg-[--orange-e646];
        }
      }

      .m-tab-anchor {
        &.\-\-active {
          @apply bg-[--orange-e646] text-[--white];

          .m-tab-anchor-text {
            @apply font-semibold;
          }
        }
      }
    }

    .m-tab-anchor {
      &:not(.\-\-active) {
        @apply bg-[--gray-f7] text-[--gray-666];

        &.\-\-icon-active {
          .m-tab-icon {
            @apply w-0;
          }
        }

        .m-tab-icon {
          @apply text-[--gray-999];
        }
      }
    }
  }
}

.m-tab-header {
  &:after {
    @apply pointer-events-none absolute bottom-0 h-[4px] w-full content-default;
  }
}
</style>
