<script setup>
const props = defineProps({
  label: {
    type: String,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    label: '',
    ...props.setClass,
  }
})
</script>

<template>
  <span class="m-dialog" :class="setClass.main">
    <em
      class="m-dialog-label flex items-center justify-center rounded-full"
      :class="setClass.label"
      v-html="props.label"
    />
  </span>
</template>

<style lang="postcss">
.m-dialog {
  &.\-\-orange-e646 {
    --dialog-border-color: var(--orange-e646);

    .m-dialog-label {
      @apply bg-[--orange-e646] text-[--white];
    }
  }

  &:after {
    @apply block h-0 w-0 border-solid border-transparent content-default;
  }
}

@screen p {
  .m-dialog {
    &.\-\-arrow-bottom,
    &.pt\:\-\-arrow-bottom,
    &.p\:\-\-arrow-bottom {
      @apply inline-block;

      &:after {
        border-width: 8px 9px 0;
        border-top-color: var(--dialog-border-color);

        @apply mx-auto mt-[-1px];
      }
    }

    &.\-\-arrow-right,
    &.pt\:\-\-arrow-right,
    &.p\:\-\-arrow-right {
      @apply inline-flex items-center;

      &:after {
        border-width: 8px 0 8px 9px;
        border-left-color: var(--dialog-border-color);

        @apply ml-[-1px];
      }
    }

    &.\-\-px-15,
    &.p\:\-\-px-15,
    &.pt\:\-\-px-15 {
      .m-dialog-label {
        @apply px-[15px];
      }
    }

    &.\-\-px-10,
    &.p\:\-\-px-10,
    &.pt\:\-\-px-10 {
      .m-dialog-label {
        @apply px-[10px];
      }
    }

    &.\-\-h-34,
    &.p\:\-\-h-34,
    &.pt\:\-\-h-34 {
      .m-dialog-label {
        @apply h-[34px];
      }
    }

    &.\-\-h-20,
    &.p\:\-\-h-20,
    &.pt\:\-\-h-20 {
      .m-dialog-label {
        @apply h-[20px];
      }
    }
  }
}

@screen t {
  .m-dialog {
    &.\-\-arrow-bottom,
    &.pt\:\-\-arrow-bottom,
    &.tm\:\-\-arrow-bottom,
    &.t\:\-\-arrow-bottom {
      @apply inline-block;

      &:after {
        border-width: 4px 5px 0;
        border-top-color: var(--dialog-border-color);

        @apply mx-auto mt-[-1px];
      }
    }

    &.\-\-arrow-right,
    &.pt\:\-\-arrow-right,
    &.tm\:\-\-arrow-right,
    &.t\:\-\-arrow-right {
      @apply inline-flex items-center;

      &:after {
        border-width: 4px 0 4px 5px;
        border-left-color: var(--dialog-border-color);

        @apply ml-[-1px];
      }
    }

    &.\-\-px-15,
    &.pt\:\-\-px-15,
    &.tm\:\-\-px-15,
    &.t\:\-\-px-15 {
      .m-dialog-label {
        @apply px-[15px];
      }
    }

    &.\-\-px-10,
    &.pt\:\-\-px-10,
    &.tm\:\-\-px-10,
    &.t\:\-\-px-10 {
      .m-dialog-label {
        @apply px-[10px];
      }
    }

    &.\-\-h-34,
    &.pt\:\-\-h-34,
    &.tm\:\-\-h-34,
    &.t\:\-\-h-34 {
      .m-dialog-label {
        @apply h-[34px];
      }
    }

    &.\-\-h-20,
    &.pt\:\-\-h-20,
    &.tm\:\-\-h-20,
    &.t\:\-\-h-20 {
      .m-dialog-label {
        @apply h-[20px];
      }
    }
  }
}

@screen m {
  .m-dialog {
    &.\-\-arrow-bottom,
    &.tm\:\-\-arrow-bottom,
    &.m\:\-\-arrow-bottom {
      @apply inline-block;

      &:after {
        border-width: 4px 5px 0;
        border-top-color: var(--dialog-border-color);

        @apply mx-auto mt-[-1px];
      }
    }

    &.\-\-arrow-right,
    &.tm\:\-\-arrow-right,
    &.m\:\-\-arrow-right {
      @apply inline-flex items-center;

      &:after {
        border-width: 4px 0 4px 5px;
        border-left-color: var(--dialog-border-color);

        @apply ml-[-1px];
      }
    }

    &.\-\-px-15,
    &.tm\:\-\-px-15,
    &.m\:\-\-px-15 {
      .m-dialog-label {
        @apply px-[15px];
      }
    }

    &.\-\-px-10,
    &.tm\:\-\-px-10,
    &.m\:\-\-px-10 {
      .m-dialog-label {
        @apply px-[10px];
      }
    }

    &.\-\-h-34,
    &.tm\:\-\-h-34,
    &.m\:\-\-h-34 {
      .m-dialog-label {
        @apply h-[34px];
      }
    }

    &.\-\-h-20,
    &.tm\:\-\-h-20,
    &.m\:\-\-h-20 {
      .m-dialog-label {
        @apply h-[20px];
      }
    }
  }
}
</style>
