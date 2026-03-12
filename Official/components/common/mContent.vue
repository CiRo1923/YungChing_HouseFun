<script setup></script>

<template>
  <div class="m-content bg-[--white]">
    <slot />
  </div>
</template>

<style lang="postcss">
@screen p {
  .m-content {
    &.\-\-px-30,
    &.p\:\-\-px-30,
    &.pt\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-py-20,
    &.p\:\-\-py-20,
    &.pt\:\-\-py-20 {
      @apply py-[20px];
    }

    &.\-\-rounded-20,
    &.p\:\-\-rounded-20,
    &.pt\:\-\-rounded-20 {
      @apply rounded-[20px];
    }
  }
}

@screen t {
  .m-content {
    &.\-\-px-30,
    &.pt\:\-\-px-30,
    &.tm\:\-\-px-30,
    &.t\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-py-20,
    &.pt\:\-\-py-20,
    &.tm\:\-\-py-20,
    &.t\:\-\-py-20 {
      @apply py-[20px];
    }

    &.\-\-rounded-20,
    &.pt\:\-\-rounded-20,
    &.tm\:\-\-rounded-20,
    &.t\:\-\-rounded-20 {
      @apply rounded-[20px];
    }
  }
}

@screen m {
  .m-content {
    &.\-\-px-30,
    &.tm\:\-\-px-30,
    &.m\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-py-20,
    &.tm\:\-\-py-20,
    &.m\:\-\-py-20 {
      @apply py-[20px];
    }

    &.\-\-rounded-20,
    &.tm\:\-\-rounded-20,
    &.m\:\-\-rounded-20 {
      @apply rounded-[20px];
    }
  }
}
</style>
