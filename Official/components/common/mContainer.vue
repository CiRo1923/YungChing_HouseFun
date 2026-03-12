<script setup></script>

<template>
  <div class="m-container mx-auto">
    <slot />
  </div>
</template>

<style lang="postcss">
.m-container {
  &.\-\-inner {
    @apply max-w-[1220px];
  }
}

@screen p {
  .m-container {
    &.\-\-inner {
      @apply px-[10px];
    }
  }
}

@screen t {
  /* .m-container {
    &.\-\-px-16,
    &.pt\:\-\-px-16,
    &.tm\:\-\-px-16,
    &.t\:\-\-px-16 {
      @apply px-[16px];
    }
  } */
}

@screen m {
  /* .m-container {
    &.\-\-px-16,
    &.tm\:\-\-px-16,
    &.m\:\-\-px-16 {
      @apply px-[16px];
    }
  } */
}
</style>
