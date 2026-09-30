<script setup>
import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

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
