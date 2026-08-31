<script setup>
import { onUnitText } from '@js/_projectPrototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// purposeID → 7: 車位(只顯示型別 / 屋齡 / 樓層)、8: 土地(不顯示樓層 / 格局),其餘用途走一般格式
const PURPOSE_ID_PARKING = 7
const PURPOSE_ID_LAND = 8

const items = computed(() => {
  const { purposeID, caseType, buildAge, floor, layout } = props.item
  const { from, to } = floor
  const isSameFloorFromTo = !from || !to || from === to
  const { room } = layout
  const isParking = Number(purposeID) === PURPOSE_ID_PARKING
  const isLand = Number(purposeID) === PURPOSE_ID_LAND

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
      isHidden: isLand || from == null,
    },
    {
      id: 'room',
      label: '房',
      value: onUnitText(room, ' 房'),
      isHidden: isLand || isParking || onUnitText(room, ' 房') == null,
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
