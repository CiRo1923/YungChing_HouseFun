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
    <template v-for="(item, index) in props.items">
      <li
        class="m-separator-item relative"
        :class="setClass.item"
        :key="`${item.id}_${index}`"
        v-if="item.isHidden !== true || !config.isHiddenItem"
      >
        <slot :item="item">
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

    &.\-\-gap-x-32,
    &.p\:\-\-gap-x-32,
    &.pt\:\-\-gap-x-32 {
      --item-before-right: -16px;

      @apply gap-x-[32px];
    }

    &.\-\-gap-x-16,
    &.p\:\-\-gap-x-16,
    &.pt\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-8,
    &.p\:\-\-gap-x-8,
    &.pt\:\-\-gap-x-8 {
      --item-before-right: -4px;

      @apply gap-x-[8px];
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

    &.\-\-gap-x-32,
    &.pt\:\-\-gap-x-32,
    &.tm\:\-\-gap-x-32,
    &.t\:\-\-gap-x-32 {
      --item-before-right: -16px;

      @apply gap-x-[32px];
    }

    &.\-\-gap-x-16,
    &.pt\:\-\-gap-x-16,
    &.tm\:\-\-gap-x-16,
    &.t\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-8,
    &.pt\:\-\-gap-x-8,
    &.tm\:\-\-gap-x-8,
    &.t\:\-\-gap-x-8 {
      --item-before-right: -4px;

      @apply gap-x-[8px];
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

    &.\-\-gap-x-32,
    &.tm\:\-\-gap-x-32,
    &.m\:\-\-gap-x-32 {
      --item-before-right: -16px;

      @apply gap-x-[32px];
    }

    &.\-\-gap-x-16,
    &.tm\:\-\-gap-x-16,
    &.m\:\-\-gap-x-16 {
      --item-before-right: -8px;

      @apply gap-x-[16px];
    }

    &.\-\-gap-x-8,
    &.tm\:\-\-gap-x-8,
    &.m\:\-\-gap-x-8 {
      --item-before-right: -4px;

      @apply gap-x-[8px];
    }
  }
}
</style>
