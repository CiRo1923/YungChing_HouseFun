<script setup>
const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  config: {
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
</script>

<template>
  <component :is="config.as" class="m-label" :for="config.for" v-bind="dataRequired">
    <slot>{{ props.label }}</slot>
  </component>
</template>

<style lang="postcss">
.m-label {
  &[data-required]:not([data-required='']) {
    &::before {
      @apply ml-[2px] text-[--orange-e646] content-[attr(data-required)];
    }
  }
}
</style>
