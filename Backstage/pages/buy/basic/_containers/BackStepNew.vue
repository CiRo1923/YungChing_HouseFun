<script setup>
const props = defineProps({
  anchor: {
    type: Object,
    default: null,
  },
  stepOptions: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    active: 0,
    ...props.config,
  }
})
</script>

<template>
  <BuyMAnchorTool :anchor="props.anchor">
    <BuyMStepArrow
      :options="props.stepOptions"
      :config="{
        active: config.active,
        icon: 'icon_check_solid',
      }"
      :setClass="{
        item: 'flex-1 gap-x-[3px]',
        icon: 'text-[--orange-e646]',
      }"
    />
  </BuyMAnchorTool>
</template>

<style></style>
