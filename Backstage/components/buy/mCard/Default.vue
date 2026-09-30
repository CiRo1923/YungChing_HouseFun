<script setup>
import './.css/variables.css'
import './.css/common.css'

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
