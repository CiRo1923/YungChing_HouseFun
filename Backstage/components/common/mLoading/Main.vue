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
  <div class="m-loading flex items-center justify-center" :class="{ '--fixed': config.isFixed }">
    <CommonMLoadingContainer
      :setClass="{
        container: 'rounded-[15px] bg-[--white] py-[30px] tm:p-[32px] p:px-[72px]',
      }"
    >
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>

<style lang="postcss">
.m-loading {
  &.\-\-fixed {
    @apply fixed inset-0 z-[5];

    &:before {
      @apply pointer-events-none absolute inset-0 bg-black/20 backdrop-blur-[2px] content-default;
    }
  }
}
</style>
