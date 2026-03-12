<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
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
    <li
      class="m-separator-item relative"
      :class="setClass.item"
      v-for="(item, index) in items"
      :key="`${item.id}_${index}`"
    >
      <slot>
        {{ item.value }}
      </slot>
    </li>
  </ul>
</template>

<style lang="postcss">
.m-separator-item {
  &:not(:first-child) {
    &:before {
      @apply pointer-events-none absolute top-1/2 -translate-y-1/2 bg-[--gray-999] content-default;
    }
  }
}

@screen p {
  .m-separator {
    &.\-\-horizontal,
    &.p\:\-\-horizontal,
    &.pt\:\-\-horizontal {
      @apply flex items-center;

      .m-separator-item {
        &:before {
          @apply left-[--item-before-left] h-[52%] w-[1px];
        }
      }
    }

    &.\-\-gap-x-20,
    &.p\:\-\-gap-x-20,
    &.pt\:\-\-gap-x-20 {
      --item-before-left: -10px;

      @apply gap-x-[20px];
    }
  }
}

@screen t {
  .m-separator {
    &.\-\-horizontal,
    &.pt\:\-\-horizontal,
    &.tm\:\-\-horizontal,
    &.t\:\-\-horizontal {
      @apply flex items-center;

      .m-separator-item {
        &:before {
          @apply left-[--item-before-left] h-[55%] w-[1px];
        }
      }
    }

    &.\-\-gap-x-20,
    &.pt\:\-\-gap-x-20,
    &.tm\:\-\-gap-x-20,
    &.t\:\-\-gap-x-20 {
      --item-before-left: -10px;

      @apply gap-x-[20px];
    }
  }
}

@screen m {
  .m-separator {
    &.\-\-horizontal,
    &.tm\:\-\-horizontal,
    &.m\:\-\-horizontal {
      @apply flex items-center;

      .m-separator-item {
        &:before {
          @apply left-[--item-before-left] h-[52%] w-[1px];
        }
      }
    }

    &.\-\-gap-x-20,
    &.tm\:\-\-gap-x-20,
    &.m\:\-\-gap-x-20 {
      --item-before-left: -10px;

      @apply gap-x-[20px];
    }
  }
}
</style>
