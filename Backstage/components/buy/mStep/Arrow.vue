<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

const props = defineProps({
  options: {
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
    active: 0,
    icon: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    item: '',
    icon: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="m-step --arrow flex items-center" :class="setClass.main">
    <li
      class="m-step-item flex items-center"
      :class="[
        {
          '--enabled': index < config.active,
          '--active': index === config.active,
        },
        setClass.item,
      ]"
      v-for="(item, index) in props.options"
      :key="`${item.label}_${index}`"
    >
      <SvgIcon
        icon="chevron_right"
        class="m-step-icon text-[--gray-e5]"
        v-if="index > config.active"
      />
      <SvgIcon
        :icon="config.icon"
        class="m-step-icon"
        :class="setClass.icon"
        v-if="index <= config.active"
      />
      <slot :item="item" :index="index">
        <em>{{ item.label }}</em>
      </slot>
    </li>
  </ul>
</template>

<style lang="postcss">
.m-step {
  &.\-\-arrow {
    .m-step-item {
      &.\-\-active {
        & ~ * {
          @apply text-[--gray-ccce];
        }
      }
    }

    .m-step-icon {
      @apply h-[18px] w-[18px] p-[1px];
    }
  }
}
</style>
