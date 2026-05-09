<script setup>
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    isFixed: false,
    ...props.config,
  }
})
</script>

<template>
  <div
    class="m-loading pointer-events-none flex items-center justify-center"
    :class="{ '--fixed': config.isFixed }"
  >
    <CommonMLoadingContainer>
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>

<style lang="postcss">
.m-loading {
  &.\-\-fixed {
    @apply fixed inset-0 z-[5];

    &:before {
      @apply absolute inset-0 bg-black/20 backdrop-blur-[2px] content-default;
    }
  }
}
</style>
