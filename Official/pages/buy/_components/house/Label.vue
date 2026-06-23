<script setup>
const props = defineProps({
  text: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-end tm:h-[22px] tm:w-[80px] p:h-[28px] p:w-[100px]"
  >
    <em
      class="block text-justify text-[--gray-999] [text-align-last:justify] tm:w-[70px] tm:text-[14px] p:w-[80px] p:text-[16px]"
    >
      {{ props.text }}
    </em>
  </span>
</template>

<style></style>
