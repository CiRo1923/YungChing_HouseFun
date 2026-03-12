<script setup>
const props = defineProps({
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
      : /^(button|submit)$/.test(as.value)
        ? {
            type: as.value,
          }
        : null
})

const config = computed(() => {
  return {
    as: 'div',
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-card --border-content" :class="setClass.main">
    <component
      :is="as"
      v-bind="bind"
      class="m-card-container overflow-hidden border-x-[1px] border-b-[1px] border-[--gray-e5]"
      :class="setClass.container"
    >
      <slot />
    </component>
    <div class="m-card-tools overflow-hidden" :class="setClass.tools" v-if="$slots.tools">
      <slot name="tools" />
    </div>
  </div>
</template>

<style src="@css/_modules/buy/mCard.css"></style>
<style lang="postcss">
@screen p {
  .m-card {
    &.\-\-border-content {
      &.\-\-content-rounded-b-10,
      &.p\:\-\-content-rounded-b-10,
      &.pt\:\-\-content-rounded-b-10 {
        .m-card-container {
          @apply rounded-b-[10px];
        }
      }

      &.\-\-content-p-15,
      &.p\:\-\-content-p-15,
      &.pt\:\-\-content-p-15 {
        .m-card-container {
          @apply p-[15px];
        }
      }

      &.\-\-tools-rounded-t-5,
      &.p\:\-\-tools-rounded-t-5,
      &.pt\:\-\-tools-rounded-t-5 {
        .m-card-tools {
          @apply rounded-t-[5px];
        }
      }
    }
  }
}

@screen t {
  .m-card {
    &.\-\-border-content {
      &.\-\-content-rounded-b-10,
      &.pt\:\-\-content-rounded-b-10,
      &.tm\:\-\-content-rounded-b-10,
      &.t\:\-\-content-rounded-b-10 {
        .m-card-container {
          @apply rounded-b-[10px];
        }
      }

      &.\-\-content-p-15,
      &.pt\:\-\-content-p-15,
      &.tm\:\-\-content-p-15,
      &.t\:\-\-content-p-15 {
        .m-card-container {
          @apply p-[15px];
        }
      }

      &.\-\-tools-rounded-t-5,
      &.pt\:\-\-tools-rounded-t-5,
      &.tm\:\-\-tools-rounded-t-5,
      &.t\:\-\-tools-rounded-t-5 {
        .m-card-tools {
          @apply rounded-t-[5px];
        }
      }
    }
  }
}

@screen m {
  .m-card {
    &.\-\-border-content {
      &.\-\-content-rounded-b-10,
      &.tm\:\-\-content-rounded-b-10,
      &.m\:\-\-content-rounded-b-10 {
        .m-card-container {
          @apply rounded-b-[10px];
        }
      }

      &.\-\-content-p-15,
      &.tm\:\-\-content-p-15,
      &.m\:\-\-content-p-15 {
        .m-card-container {
          @apply p-[15px];
        }
      }

      &.\-\-tools-rounded-t-5,
      &.tm\:\-\-tools-rounded-t-5,
      &.t\:\-\-tools-rounded-t-5 {
        .m-card-tools {
          @apply rounded-t-[5px];
        }
      }
    }
  }
}
</style>
