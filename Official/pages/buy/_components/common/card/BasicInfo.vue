<script setup>
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
      value: `${buildAge} 年`,
    },
    {
      id: 'floor',
      label: '樓層',
      value: `${isSameFloorFromTo ? from : ` ~ ${to}`} 樓`,
    },
    {
      id: 'room',
      label: '房',
      value: `${room} 房`,
    },
  ]
})
</script>

<template>
  <BuyMSeparator
    :items="items"
    :setClass="{
      main: '--horizontal --gap-x-16',
      item: 'text-[14px]',
    }"
  />
</template>

<style></style>
