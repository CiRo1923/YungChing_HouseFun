<script setup>
import '@css/_modules/common/mContainer/variables.css'
import '@css/_modules/common/mContainer/common.css'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    as: 'div',
    ...props.config,
  }
})
</script>

<template>
  <component :is="config.as" class="m-container">
    <slot />
  </component>
</template>
