<script setup>
import '@css/_modules/buy/mCard/variables.css'
import '@css/_modules/buy/mCard/common.css'

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-card --default --bg-white --rounded-15" :class="setClass.main">
    <slot />
  </div>
</template>
