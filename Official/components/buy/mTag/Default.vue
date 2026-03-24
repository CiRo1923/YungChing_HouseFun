<script setup>
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
      <em class="m-tag-label tracking-default" :class="setClass.label">{{ props.label }}</em>
    </slot>
  </span>
</template>

<style src="@css/_modules/buy/mTag.css" />
<style></style>
