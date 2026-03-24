<script setup></script>

<template>
  <div class="m-content bg-[--white]">
    <slot />
  </div>
</template>

<style lang="postcss">
@screen p {
  .m-content {
    &.\-\-p-24,
    &.p\:\-\-p-24,
    &.pt\:\-\-p-24 {
      @apply p-[24px];
    }

    &.\-\-px-40,
    &.p\:\-\-px-40,
    &.pt\:\-\-px-40 {
      @apply px-[40px];
    }

    &.\-\-px-30,
    &.p\:\-\-px-30,
    &.pt\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-px-16,
    &.p\:\-\-px-16,
    &.pt\:\-\-px-16 {
      @apply px-[16px];
    }

    &.\-\-py-30,
    &.p\:\-\-py-30,
    &.pt\:\-\-py-30 {
      @apply py-[30px];
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
    &.\-\-p-24,
    &.pt\:\-\-p-24,
    &.tm\:\-\-p-24,
    &.t\:\-\-p-24 {
      @apply p-[24px];
    }

    &.\-\-px-16,
    &.pt\:\-\-px-16,
    &.tm\:\-\-px-16,
    &.t\:\-\-px-16 {
      @apply px-[16px];
    }

    &.\-\-px-40,
    &.pt\:\-\-px-40,
    &.tm\:\-\-px-40,
    &.t\:\-\-px-40 {
      @apply px-[40px];
    }

    &.\-\-px-30,
    &.pt\:\-\-px-30,
    &.tm\:\-\-px-30,
    &.t\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-py-30,
    &.pt\:\-\-py-30,
    &.tm\:\-\-py-30,
    &.t\:\-\-py-30 {
      @apply py-[30px];
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
    &.\-\-p-24,
    &.tm\:\-\-p-24,
    &.m\:\-\-p-24 {
      @apply p-[24px];
    }

    &.\-\-px-16,
    &.tm\:\-\-px-16,
    &.m\:\-\-px-16 {
      @apply px-[16px];
    }

    &.\-\-px-40,
    &.tm\:\-\-px-40,
    &.m\:\-\-px-40 {
      @apply px-[40px];
    }

    &.\-\-px-30,
    &.tm\:\-\-px-30,
    &.m\:\-\-px-30 {
      @apply px-[30px];
    }

    &.\-\-py-30,
    &.tm\:\-\-py-30,
    &.m\:\-\-py-30 {
      @apply py-[30px];
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
