<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="border-dashed m:mx-[15px] m:pt-[15px] t:w-full t:p-[10px] tm:mt-[15px] tm:border-t-[1px] tm:border-t-[--gray-e5] p:w-[155px] p:shrink-0 p:border-l-[1px] p:border-l-[--gray-e5] p:px-[20px] p:py-[15px]"
  >
    <p class="text-[12px] text-[--gray-999]">備註：{{ props.item.note || '--' }}</p>
  </div>
</template>

<style lang="postcss"></style>
