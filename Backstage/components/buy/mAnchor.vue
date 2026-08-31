<script setup>
import '@css/_modules/buy/mAnchor/variables.css'
import '@css/_modules/buy/mAnchor/common.css'

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

  if (as === 'router') return resolveComponent('NuxtLink')
  if (/^(button|submit)$/.test(as)) return 'button'
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const bind = computed(() => {
  const name = typeof as.value === 'object' ? as.value.name : as.value
  return name === 'NuxtLink'
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
          // 具名 target 會複用同一個分頁,不給就照舊每次開新的
          target: config.value.target || '_blank',
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
    class="m-anchor"
    :class="setClass.main"
    v-bind="bind"
    :disabled="config.isDisabled"
    @click="onClick"
  >
    <slot>
      <CommonSvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'left' && icon.name"
      />
      <em class="m-anchor-text" :class="setClass.text">
        {{ props.text }}
      </em>
      <CommonSvgIcon
        :icon="icon.name"
        :class="setClass.icon"
        v-if="icon.position === 'right' && icon.name"
      />
    </slot>
  </component>
</template>
