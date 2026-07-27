<script setup>
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    as: 'div',
    ...props.config,
  }
})
</script>

<template>
  <component :is="config.as" class="m-container mx-auto">
    <slot />
  </component>
</template>

<style lang="postcss">
@screen p {
  .m-container {
    &.\-\-max-w-1220,
    &.p\:\-\-max-w-1220,
    &.pt\:\-\-max-w-1220 {
      @apply max-w-[1220px];
    }

    &.\-\-max-w-500,
    &.p\:\-\-max-w-500,
    &.pt\:\-\-max-w-500 {
      @apply max-w-[500px];
    }

    &.\-\-max-w-400,
    &.p\:\-\-max-w-400,
    &.pt\:\-\-max-w-400 {
      @apply max-w-[400px];
    }

    &.\-\-px-10,
    &.p\:\-\-px-10,
    &.pt\:\-\-px-10 {
      @apply px-[10px];
    }
  }
}

@screen t {
  .m-container {
    &.\-\-max-w-1220,
    &.pt\:\-\-max-w-1220,
    &.tm\:\-\-max-w-1220,
    &.t\:\-\-max-w-1220 {
      @apply max-w-[1220px];
    }

    &.\-\-max-w-500,
    &.pt\:\-\-max-w-500,
    &.tm\:\-\-max-w-500,
    &.t\:\-\-max-w-500 {
      @apply max-w-[500px];
    }

    &.\-\-max-w-400,
    &.pt\:\-\-max-w-400,
    &.tm\:\-\-max-w-400,
    &.t\:\-\-max-w-400 {
      @apply max-w-[400px];
    }

    &.\-\-px-10,
    &.pt\:\-\-px-10,
    &.tm\:\-\-px-10,
    &.t\:\-\-px-10 {
      @apply px-[10px];
    }
  }
}

@screen m {
  .m-container {
    &.\-\-max-w-1220,
    &.tm\:\-\-max-w-1220,
    &.m\:\-\-max-w-1220 {
      @apply max-w-[1220px];
    }

    &.\-\-max-w-500,
    &.tm\:\-\-max-w-500,
    &.m\:\-\-max-w-500 {
      @apply max-w-[500px];
    }

    &.\-\-max-w-400,
    &.tm\:\-\-max-w-400,
    &.m\:\-\-max-w-400 {
      @apply max-w-[400px];
    }

    &.\-\-px-10,
    &.tm\:\-\-px-10,
    &.m\:\-\-px-10 {
      @apply px-[10px];
    }
  }
}
</style>
