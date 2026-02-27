<script setup>
const route = useRoute()
const props = defineProps({
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
  <div class="m-container mx-auto tm:pt-[32px] p:max-w-[1232px] p:pt-[40px]" :class="setClass.main">
    <header class="m-container-header p:flex p:items-center">
      <h2 class="text-[--gray-333] tm:text-center tm:text-[24px] p:grow p:text-[30px]">
        <strong class="font-semibold">{{ route.meta.title }}</strong>
      </h2>
      <div class="m-container-header-tools p:shrink-0" v-if="$slots.header_tools">
        <slot name="header_tools" />
      </div>
    </header>
    <div class="m-container-body mt-[32px]">
      <div class="m-container-tools mb-[32px]" v-if="$slots.tools">
        <slot name="tools" />
      </div>
      <div class="m-container-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@screen p {
  .m-container {
    &.\-\-px-16,
    &.p\:\-\-px-16,
    &.pt\:\-\-px-16 {
      @apply px-[16px];
    }
  }
}

@screen t {
  .m-container {
    &.\-\-px-16,
    &.pt\:\-\-px-16,
    &.tm\:\-\-px-16,
    &.t\:\-\-px-16 {
      @apply px-[16px];
    }
  }
}

@screen m {
  .m-container {
    &.\-\-px-16,
    &.tm\:\-\-px-16,
    &.m\:\-\-px-16 {
      @apply px-[16px];
    }
  }
}
</style>
