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
    main: '',
    label: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div
    class="list-setting flex min-h-[45px] items-center rounded-[15px] border-[1px] px-[12px] text-[14px]"
    :class="setClass.main"
  >
    <p class="mr-[8px] flex items-center gap-x-[4px]" :class="setClass.label">
      <CommonSvgIcon
        :icon="config.icon"
        class="h-[16px] w-[16px] shrink-0 text-[--orange-e646]"
        v-if="config.icon"
      />
      <b class="shrink-0 font-semibold">{{ props.label }}</b>
    </p>
    <p class="grow text-[--gray-666]">
      <slot />
    </p>
    <div class="shrink-0" v-if="$slots.tools">
      <slot name="tools" />
    </div>
  </div>
</template>

<style lang="postcss">
.list-setting {
  &.\-\-bg-yellow {
    @apply bg-[--yellow-ffdc];
  }

  &.\-\-bg-gray {
    @apply bg-[--gray-f7];
  }

  &.\-\-border-yellow {
    @apply border-[--yellow-ffab];
  }

  &.\-\-border-gray {
    @apply border-[--gray-e5];
  }
}
</style>
