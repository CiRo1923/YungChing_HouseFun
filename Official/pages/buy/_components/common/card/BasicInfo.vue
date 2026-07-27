<script setup>
import { onUnitText } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const { caseType, buildAge, floor, layout } = props.item
  const { from, to } = floor
  const isSameFloorFromTo = !from || !to || from === to
  const { room } = layout

  return [
    {
      id: 'caseType',
      label: '型別',
      value: caseType,
      isHidden: !caseType,
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: onUnitText(buildAge, ' 年'),
      isHidden: onUnitText(buildAge, ' 年') == null,
    },
    {
      id: 'floor',
      label: '樓層',
      value: `${isSameFloorFromTo ? from : ` ~ ${to}`} 樓`,
      isHidden: from == null,
    },
    {
      id: 'room',
      label: '房',
      value: onUnitText(room, ' 房'),
      isHidden: onUnitText(room, ' 房') == null,
    },
  ]
})
</script>

<template>
  <CommonMSeparator
    :items="items"
    :setClass="{
      main: '--horizontal --gap-x-16',
      item: 'text-[14px]',
    }"
  />
</template>

<style></style>
