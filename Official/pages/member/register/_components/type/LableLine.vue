<script setup>
const props = defineProps({
  label: {
    type: String,
    default: null,
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
    icon: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: null,
    icon: null,
    ...props.setClass,
  }
})
</script>

<template>
  <div class="lable-line flex items-center gap-x-[5px]" :class="setClass.main">
    <CommonSvgIcon :icon="config.icon" class="shrink-0" :class="setClass.icon" v-if="config.icon" />
    <em class="shrink-0">{{ props.label }}</em>
  </div>
</template>

<style lang="postcss">
.lable-line {
  @apply text-[--label-line-color];

  &:after {
    @apply ml-[10px] h-[1px] grow bg-[--label-line-color] content-default;
  }

  &.\-\-green-8b0d {
    --label-line-color: var(--green-8b0d);
  }
}
</style>
