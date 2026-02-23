<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

const emits = defineEmits(['click'])
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  to: {
    type: Object,
    default: null,
  },
  href: {
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
    as: null,
    icon: null,
    target: null,
    isDisabled: false,
    ...props.config,
  }
})

const as = computed(() => {
  const { as } = config.value

  if (as === 'router') return 'router-link'
  if (/^(button|submit)$/.test(as)) return 'button'
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const bind = computed(() => {
  return as.value === 'router-link'
    ? {
        to: props.to,
        ...(config.value.target
          ? {
              target: config.value.target,
              rel: 'noopener',
            }
          : {}),
      }
    : as.value === 'a'
      ? {
          href: props.href,
          target: '_blank',
          rel: 'noopener',
        }
      : as.value !== 'div'
        ? {
            type: as.value,
          }
        : null
})

const icon = computed(() => {
  const { icon } = config.value
  const isString = icon ? typeof icon === 'string' : true

  return {
    position: isString ? 'right' : icon.position,
    name: isString ? icon : icon.name,
  }
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      text: '',
      icon: '',
    },
    ...props.setClass,
  }
})

const onClick = (e) => {
  const { isDisabled } = config.value
  if (isDisabled) {
    e.preventDefault()
  } else {
    emits('click', e)
  }
}
</script>

<template>
  <component
    :is="as"
    class="m-anchor relative inline-flex items-center justify-center gap-x-[5px] tracking-[0.06em] transition-colors duration-300"
    :class="setClass.main"
    v-bind="bind"
    :disabled="config.isDisabled"
    @click="onClick"
  >
    <slot>
      <SvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'left' && icon.name"
      />
      <b class="m-anchor-text" :class="setClass.text">
        {{ props.text }}
      </b>
      <SvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'right' && icon.name"
      />
    </slot>
  </component>
</template>

<style lang="postcss">
.m-anchor {
  &[class*='--border'] {
    @apply border-[1px];
  }

  &.\-\-oval {
    @apply rounded-full;
  }

  &:not(:disabled) {
    &.\-\-text-white {
      @apply text-[--white];
    }

    &.\-\-bg-green-6a2d {
      @apply bg-[--green-6a2d];
    }

    &.\-\-border-gray-e5 {
      @apply border-[--gray-e5];
    }
  }

  &:disabled {
    @apply cursor-not-allowed bg-[--gray-e5] text-[--white];
  }
}

@screen p {
  .m-anchor {
    &.\-\-px-20,
    &.p\:\-\-px-20,
    &.pt\:\-\-px-20 {
      @apply px-[20px];
    }

    &.\-\-py-5,
    &.p\:\-\-py-5,
    &.pt\:\-\-py-5 {
      @apply py-[5px];
    }

    &.\-\-height-40,
    &.p\:\-\-height-40,
    &.pt\:\-\-height-40 {
      @apply h-[40px];
    }
  }
}

@screen t {
  .m-anchor {
    &.\-\-px-20,
    &.pt\:\-\-px-20,
    &.tm\:\-\-px-20,
    &.t\:\-\-px-20 {
      @apply px-[20px];
    }

    &.\-\-py-5,
    &.pt\:\-\-py-5,
    &.tm\:\-\-py-5,
    &.t\:\-\-py-5 {
      @apply py-[5px];
    }

    &.\-\-height-40,
    &.pt\:\-\-height-40,
    &.tm\:\-\-height-40,
    &.t\:\-\-height-40 {
      @apply h-[40px];
    }
  }
}

@screen m {
  .m-anchor {
    &.\-\-px-20,
    &.tm\:\-\-px-20,
    &.m\:\-\-px-20 {
      @apply px-[20px];
    }

    &.\-\-py-5,
    &.tm\:\-\-py-5,
    &.m\:\-\-py-5 {
      @apply py-[5px];
    }

    &.\-\-height-40,
    &.tm\:\-\-height-40,
    &.m\:\-\-height-40 {
      @apply h-[40px];
    }
  }
}
</style>
