<script setup>
import '@css/_modules/common/mLabel/variables.css'
import '@css/_modules/common/mLabel/common.css'

const props = defineProps({
  label: {
    type: String,
    default: '',
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
    as: 'span',
    for: null,
    isRequired: true,
    ...props.config,
  }
})

const dataRequired = computed(() => {
  const { isRequired } = config.value

  return isRequired
    ? {
        'data-required': typeof isRequired === 'boolean' ? '*' : isRequired,
      }
    : {}
})

const setClass = computed(() => ({
  main: '',
  title: '',
  ...props.setClass,
}))
</script>

<template>
  <component
    :is="config.as"
    class="m-label"
    :for="config.for"
    :class="setClass.main"
    v-bind="dataRequired"
  >
    <slot>{{ props.label }}</slot>
  </component>
</template>

