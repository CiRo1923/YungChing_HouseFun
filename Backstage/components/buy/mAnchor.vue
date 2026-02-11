<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

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
  if (props.isDisabled) {
    e.preventDefault()
  } else {
    emits('click', e)
  }
}
</script>

<template>
  <component
    :is="as"
    class="m-anchor relative inline-flex items-center justify-center gap-x-[5px] transition-colors duration-300"
    :class="setClass.main"
    v-bind="bind"
    :disabled="config.isDisabled"
  >
    <slot>
      <SvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'left' && icon.name"
      />
      <em class="m-anchor-text" :class="setClass.text">
        {{ props.text }}
      </em>
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
  &.\-\-oval {
    @apply rounded-full;
  }

  &.\-\-bg-white {
    @apply bg-[--white];
  }

  &[class*='--border'] {
    @apply border-[1px];
  }

  &.\-\-border-gray-e5 {
    @apply border-[--gray-e5];
  }
}

@screen p {
  .m-anchor {
    &.\-\-px-15,
    &.p\:\-\-px-15,
    &.pt\:\-\-px-15 {
      @apply px-[15px];
    }

    &.\-\-height-30,
    &.p\:\-\-height-30,
    &.pt\:\-\-height-30 {
      @apply h-[30px];
    }
  }
}

@screen t {
  .m-anchor {
    &.\-\-px-15,
    &.pt\:\-\-px-15,
    &.tm\:\-\-px-15,
    &.t\:\-\-px-15 {
      @apply px-[15px];
    }

    &.\-\-height-30,
    &.pt\:\-\-height-30,
    &.tm\:\-\-height-30,
    &.t\:\-\-height-30 {
      @apply h-[30px];
    }
  }
}

@screen m {
  .m-anchor {
    &.\-\-px-15,
    &.tm\:\-\-px-15,
    &.m\:\-\-px-15 {
      @apply px-[15px];
    }

    &.\-\-height-30,
    &.tm\:\-\-height-30,
    &.m\:\-\-height-30 {
      @apply h-[30px];
    }
  }
}
</style>
