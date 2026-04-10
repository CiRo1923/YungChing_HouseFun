<script setup>
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

const config = computed(() => {
  return {
    active: null,
    containerMode: 'multiple', // multiple / single / false
    schema: {
      id: 'id',
      label: 'label',
    },
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
  const { containerMode } = config.value
  const isURL = !!(href || to)
  const isSingle = containerMode === 'single'
  const isMultiple = containerMode === 'multiple'

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

onUnmounted(() => {
  onCancelAnimationFram()
})

onMounted(() => {
  onInit()
})
</script>

<template>
  <div class="m-tab --default-oval" :class="setClass.main">
    <ul class="m-tab-header flex" :class="setClass.header">
      <li
        class="m-tab-header-item flex items-center"
        :class="setClass.headerItem"
        v-for="(item, index) in props.items"
        :key="`tab_header_${item[config.schema.id]}_${index}`"
      >
        <component
          :is="onHeaderAs(item)"
          class="m-tab-anchor flex w-full items-center justify-center gap-x-[4px] px-[10px] py-[8px] text-[16px] transition-colors duration-300"
          :class="[
            {
              '--active': index === activeIndex,
            },
            setClass.anchor,
          ]"
          v-bind="onHeaderBind(item)"
          @click="onClick(item, index)"
        >
          <CommonSvgIcon
            :icon="item.icon"
            class="m-tab-icon h-[22px] w-[22px] p-[2px] transition-colors duration-300"
          />
          <slot name="header" :item="item" :index="index">
            <b class="font-semibold">{{ item[config.schema.label] }}</b>
          </slot>
        </component>
      </li>
    </ul>
    <div class="m-tab-body relative z-[1]" :class="setClass.body">
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
    &.\-\-green-8b0d {
      .m-tab-anchor {
        &.\-\-active {
          @apply bg-[--green-8b0d] text-[--white];
        }
      }
    }

    .m-tab-anchor {
      &:not(.\-\-active) {
        @apply text-[--gray-666];

        .m-tab-icon {
          @apply text-[--gray-999];
        }
      }
    }
  }
}

@screen pt {
  .m-tab {
    &.\-\-default-oval {
      &.\-\-green-8b0d {
        .m-tab-body {
          @apply border-t-[--green-8b0d];
        }
      }

      .m-tab-header {
        @apply gap-x-[8px];
      }

      .m-tab-body {
        @apply mt-[-3px] border-t-[4px];
      }

      .m-tab-anchor {
        @apply rounded-t-[15px];

        &:not(.\-\-active) {
          @apply bg-[--gray-f7];
        }

        &.\-\-active {
          @apply shadow-black-y2-b4;
        }
      }
    }
  }
}

@screen m {
  .m-tab {
    &.\-\-default-oval {
      .m-tab-header {
        @apply bg-[--gray-f7];
      }

      .m-tab-header-item {
        &:not(:first-child) {
          .m-tab-anchor {
            @apply rounded-l-full;
          }
        }

        &:not(:last-child) {
          .m-tab-anchor {
            @apply rounded-r-full;
          }
        }
      }
    }
  }
}
</style>
