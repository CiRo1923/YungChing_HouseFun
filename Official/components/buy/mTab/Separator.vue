<script setup>
import { onDevice } from '@js/_prototype.js'

const emits = defineEmits(['click'])
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
const device = ref('p')
const activeIndex = ref(null)
const config = computed(() => {
  return {
    active: 0,
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
    ...props.setClass,
  }
})

const onAs = (item) => {
  const { to, href } = item
  if (to) return 'router-link'
  if (href) return 'a'

  return 'button'
}

const onBind = (item, index) => {
  const { to, href, target } = item
  const as = onAs(item)
  const isRouter = as === 'router-link'
  const isAnchor = as === 'a'
  const targetBind = target
    ? {
        target,
        rel: 'noopener',
      }
    : {}

  if (isRouter)
    return {
      to,
      onClick: () => onClick(index, item),
      ...targetBind,
    }

  if (isAnchor)
    return {
      href,
      onClick: () => onClick(index, item),
      ...targetBind,
    }

  return {
    type: 'button',
    onClick: () => onClick(index, item),
  }
}

const onShow = (item) => {
  const { hidden } = item

  if (!hidden) return true

  const isBoolean = typeof hidden === 'boolean'
  if (isBoolean) return !hidden

  return hidden === device.value
}

const onClick = (index, item) => {
  if (activeIndex.value === index) return false

  activeIndex.value = index
  emits('click', {
    index,
    item,
  })
}

const onInit = () => {
  const { active } = config.value
  activeIndex.value = active
}

const onResize = () => {
  device.value = onDevice()
}

onMounted(() => {
  onInit()
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-tab --separator" :class="setClass.main">
    <div class="m-tab-header" :class="setClass.header">
      <ul class="m-tab-header-content flex items-center">
        <template v-for="(item, index) in props.items" :key="`${item[config.schema.id]}_${index}`">
          <li class="m-tab-header-item relative" v-if="onShow(item)">
            <component
              :is="onAs(item)"
              class="m-tab-header-anchor transition-colors duration-300 tm:text-[14px] p:text-[16px]"
              :class="{ '--active': activeIndex === index }"
              v-bind="onBind(item, index)"
            >
              <em v-html="item[config.schema.label]" />
            </component>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<style lang="postcss">
.m-tab {
  &.\-\-separator {
    .m-tab-header-anchor {
      &:not(.\-\-active) {
        @apply text-[--gray-666];
      }

      &.\-\-active {
        @apply font-bold text-[--gray-333];
      }
    }
  }
}

@screen p {
  .m-tab {
    &.\-\-separator {
      &.\-\-line,
      &.p\:\-\-line,
      &.pt\:\-\-line {
        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              @apply absolute right-[--tab-separator-after-right] top-1/2 h-[62.5%] w-[1px] -translate-y-1/2 bg-[--gray-ccce] content-default;
            }
          }
        }
      }

      &.\-\-gap-x-30,
      &.p\:\-\-gap-x-30,
      &.pt\:\-\-gap-x-30 {
        .m-tab-header-content {
          @apply gap-x-[30px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -15px;
            }
          }
        }
      }

      &.\-\-gap-x-5,
      &.p\:\-\-gap-x-5,
      &.pt\:\-\-gap-x-5 {
        .m-tab-header-content {
          @apply gap-x-[5px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -3px;
            }
          }
        }
      }

      .m-tab-header-anchor {
        @apply px-[10px];
      }
    }
  }
}

@screen tm {
  .m-tab {
    &.\-\-separator {
      .m-tab-header-content {
        @apply gap-x-[5px];
      }

      .m-tab-header-anchor {
        @apply px-[15px];
      }
    }
  }
}

@screen t {
  .m-tab {
    &.\-\-separator {
      &.\-\-line,
      &.pt\:\-\-line,
      &.tm\:\-\-line,
      &.t\:\-\-line {
        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              @apply absolute right-[--tab-separator-after-right] top-1/2 h-[62.5%] w-[1px] -translate-y-1/2 bg-[--gray-ccce] content-default;
            }
          }
        }
      }

      &.\-\-gap-x-30,
      &.pt\:\-\-gap-x-30,
      &.tm\:\-\-gap-x-30,
      &.t\:\-\-gap-x-30 {
        .m-tab-header-content {
          @apply gap-x-[30px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -15px;
            }
          }
        }
      }

      &.\-\-gap-x-5,
      &.pt\:\-\-gap-x-5,
      &.tm\:\-\-gap-x-5,
      &.t\:\-\-gap-x-5 {
        .m-tab-header-content {
          @apply gap-x-[5px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -3px;
            }
          }
        }
      }
    }
  }
}

@screen m {
  .m-tab {
    &.\-\-separator {
      &.\-\-line,
      &.tm\:\-\-line,
      &.m\:\-\-line {
        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              @apply absolute right-[--tab-separator-after-right] top-1/2 h-[62.5%] w-[1px] -translate-y-1/2 bg-[--gray-ccce] content-default;
            }
          }
        }
      }

      &.\-\-gap-x-30,
      &.tm\:\-\-gap-x-30,
      &.m\:\-\-gap-x-30 {
        .m-tab-header-content {
          @apply gap-x-[30px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -15px;
            }
          }
        }
      }

      &.\-\-gap-x-5,
      &.tm\:\-\-gap-x-5,
      &.m\:\-\-gap-x-5 {
        .m-tab-header-content {
          @apply gap-x-[5px];
        }

        .m-tab-header-item {
          &:not(:last-child) {
            &::after {
              --tab-separator-after-right: -3px;
            }
          }
        }
      }
    }
  }
}
</style>
