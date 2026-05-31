<script setup>
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="m-loading-container relative text-[14px] text-[--gray-999]"
    :class="props.setClass?.container"
  >
    <p class="m-loading-text">
      <slot>資料讀取中，感謝您耐心等候！</slot>
    </p>
  </div>
</template>

<style lang="postcss"></style>
