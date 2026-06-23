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
    class="border-dashed m:mx-[15px] m:mt-[15px] m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[15px] t:w-[100px] t:px-[10px] pt:shrink-0 pt:border-l-[1px] pt:border-l-[--gray-e5] p:w-[155px] p:px-[20px] p:py-[15px]"
  >
    <p class="text-[12px] text-[--gray-999]">備註：{{ props.item.note || '--' }}</p>
  </div>
</template>

<style lang="postcss"></style>
