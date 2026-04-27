<script setup>
const props = defineProps({
  text: {
    type: String,
    default: null,
  },
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
  <span
    class="block text-[--gray-999] tm:w-[80px] tm:text-[14px] p:w-[100px] p:text-[16px]"
    :class="setClass.main"
  >
    {{ props.text }}
  </span>
</template>

<style></style>
