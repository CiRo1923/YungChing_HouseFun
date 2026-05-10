<script setup>
const props = defineProps({
  label: {
    type: String,
    default: null,
  },
  icon: {
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
    icon: '',
    ...props.setClass,
  }
})
</script>

<template>
  <p
    class="flex items-center justify-center gap-x-[10px] tm:text-[20px] p:text-[24px]"
    :class="setClass.main"
  >
    <CommonSvgIcon :icon="props.icon" class="h-[28px] w-[28px]" :class="setClass.icon" />
    <b class="font-medium">{{ props.label }}</b>
  </p>
</template>

<style lang="postcss"></style>
