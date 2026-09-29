<script setup>
import './.css/variables.css'
import './.css/common.css'

const props = defineProps({
  label: {
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

// const config = computed(() => {
//   return {
//     ...props.config,
//   }
// })

const setClass = computed(() => {
  return {
    main: '',
    label: '',
    ...props.setClass,
  }
})
</script>

<template>
  <span class="m-tag" :class="setClass.main">
    <slot>
      <em class="m-tag-label" :class="setClass.label">{{ props.label }}</em>
    </slot>
  </span>
</template>
