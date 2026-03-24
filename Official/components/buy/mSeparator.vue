<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    isHiddenItem: true,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    item: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="m-separator" :class="setClass.main">
    <template v-for="(item, index) in items">
      <li
        class="m-separator-item relative"
        :class="setClass.item"
        :key="`${item.id}_${index}`"
        v-if="item.isHidden !== true || !config.isHiddenItem"
      >
        <slot :name="`item_${index + 1}`" :item="item" :value="item.value">
          <span v-html="item.value" />
        </slot>
      </li>
    </template>
  </ul>
</template>

<style lang="postcss">
.m-separator-item {
  &:not(:last-child) {
    &:after {
      @apply pointer-events-none absolute top-1/2 h-[55%] w-[1px] -translate-y-1/2 bg-[--gray-999] content-default;
    }
  }
}

@screen p {
  .m-separator {
    &.\-\-horizontal,
    &.p\:\-\-horizontal,
    &.pt\:\-\-horizontal {
      @apply flex;

      .m-separator-item {
        &:after {
          @apply right-[--item-before-right];
        }
      }
    }

    &.\-\-gap-x-30,
    &.p\:\-\-gap-x-30,
    &.pt\:\-\-gap-x-30 {
      --item-before-right: -15px;

      @apply gap-x-[30px];
    }

    &.\-\-gap-x-25,
    &.p\:\-\-gap-x-25,
    &.pt\:\-\-gap-x-25 {
      --item-before-right: -13px;

      @apply gap-x-[25px];
    }

    &.\-\-gap-x-20,
    &.p\:\-\-gap-x-20,
    &.pt\:\-\-gap-x-20 {
      --item-before-right: -10px;

      @apply gap-x-[20px];
    }

    &.\-\-gap-x-16,
    &.p\:\-\-gap-x-16,
    &.pt\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-12,
    &.p\:\-\-gap-x-12,
    &.pt\:\-\-gap-x-12 {
      --item-before-right: -6px;

      @apply gap-x-[12px];
    }
  }
}

@screen t {
  .m-separator {
    &.\-\-horizontal,
    &.pt\:\-\-horizontal,
    &.tm\:\-\-horizontal,
    &.t\:\-\-horizontal {
      @apply flex;

      .m-separator-item {
        &:after {
          @apply right-[--item-before-right];
        }
      }
    }

    &.\-\-gap-x-30,
    &.pt\:\-\-gap-x-30,
    &.tm\:\-\-gap-x-30,
    &.t\:\-\-gap-x-30 {
      --item-before-right: -15px;

      @apply gap-x-[30px];
    }

    &.\-\-gap-x-25,
    &.pt\:\-\-gap-x-25,
    &.tm\:\-\-gap-x-25,
    &.t\:\-\-gap-x-25 {
      --item-before-right: -13px;

      @apply gap-x-[25px];
    }

    &.\-\-gap-x-20,
    &.pt\:\-\-gap-x-20,
    &.tm\:\-\-gap-x-20,
    &.t\:\-\-gap-x-20 {
      --item-before-right: -10px;

      @apply gap-x-[20px];
    }

    &.\-\-gap-x-16,
    &.pt\:\-\-gap-x-16,
    &.tm\:\-\-gap-x-16,
    &.t\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-12,
    &.pt\:\-\-gap-x-12,
    &.tm\:\-\-gap-x-12,
    &.t\:\-\-gap-x-12 {
      --item-before-right: -6px;

      @apply gap-x-[12px];
    }
  }
}

@screen m {
  .m-separator {
    &.\-\-horizontal,
    &.tm\:\-\-horizontal,
    &.m\:\-\-horizontal {
      @apply flex;

      .m-separator-item {
        &:after {
          @apply right-[--item-before-right];
        }
      }
    }

    &.\-\-gap-x-30,
    &.tm\:\-\-gap-x-30,
    &.m\:\-\-gap-x-30 {
      --item-before-right: -15px;

      @apply gap-x-[30px];
    }

    &.\-\-gap-x-25,
    &.tm\:\-\-gap-x-25,
    &.m\:\-\-gap-x-25 {
      --item-before-right: -13px;

      @apply gap-x-[25px];
    }

    &.\-\-gap-x-20,
    &.tm\:\-\-gap-x-20,
    &.m\:\-\-gap-x-20 {
      --item-before-right: -10px;

      @apply gap-x-[20px];
    }

    &.\-\-gap-x-16,
    &.tm\:\-\-gap-x-16,
    &.m\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-12,
    &.tm\:\-\-gap-x-12,
    &.m\:\-\-gap-x-12 {
      --item-before-right: -6px;

      @apply gap-x-[12px];
    }
  }
}
</style>
