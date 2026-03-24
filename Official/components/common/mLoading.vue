<script setup>
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    isFixed: true,
    ...props.config,
  }
})
</script>

<template>
  <div
    class="m-loading pointer-events-none inset-0 z-[10] flex items-center justify-center"
    :class="{ fixed: !config.isFixed }"
  >
    <div class="m-loading-text relative bg-[--white] text-[14px] text-[--gray-999]">Loading</div>
  </div>
</template>

<style lang="postcss">
.m-loading {
  &:before {
    @apply absolute inset-0 bg-black/20 backdrop-blur-[2px] content-default;
  }
}
</style>
