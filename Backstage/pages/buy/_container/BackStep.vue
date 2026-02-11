<script setup>
import AnchorTool from '@components/buy/mAnchorTool.vue'
import StepArrow from '~/components/buy/mStep/Arrow.vue'

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
  <AnchorTool :anchor="props.anchor">
    <StepArrow
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
  </AnchorTool>
</template>

<style></style>
