<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// purposeID → 7: 車位(只顯示型態 / 屋齡 / 樓層)、8: 土地(不顯示樓層 / 格局),其餘用途走一般格式
const PURPOSE_ID_PARKING = 7
const PURPOSE_ID_LAND = 8

const basicInfo = computed(() => {
  const { purposeID, caseType, buildAge, floor, layout } = props.item
  const isParking = Number(purposeID) === PURPOSE_ID_PARKING
  const isLand = Number(purposeID) === PURPOSE_ID_LAND
  const { from, to, up } = floor // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const isSameFloorFromTo = !from || !to || from === to
  const roomText = room ? `${room} 房 (室)` : ''
  const livingText = living ? `${living} 廳` : ''
  const bathText = bath ? `${bath} 衛` : ''
  const addonRoomText = addon.room ? ` ${addon.room} 房 (室)` : ''
  const addonLivingText = addon.living ? ` ${addon.living} 廳` : ''
  const addonBathText = addon.bath ? ` ${addon.bath} 衛` : ''
  const addonText = hasAddon ? `(含加蓋${addonRoomText}${addonLivingText}${addonBathText} )` : ''
  const layoutValue = [roomText, livingText, bathText, addonText].filter(Boolean).join(' ') || null

  return [
    {
      id: 'caseType',
      label: '型態',
      value: caseType,
      isHidden: !caseType,
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: buildAge ? `${buildAge} 年` : null,
      isHidden: !buildAge,
    },
    {
      id: 'floor',
      label: '樓層',
      value: `${from}${!isSameFloorFromTo ? ` ~ ${to}` : ''}${up ? ` / ${up}` : ''} 樓`,
      isHidden: isLand,
    },
    {
      id: 'layout',
      label: '格局',
      value: layoutValue,
      isHidden: isLand || isParking || !layoutValue,
    },
  ]
})
</script>

<template>
  <!-- <pre>
    {{ props.item }}
  </pre> -->
  <CommonMSeparator
    :items="basicInfo"
    :setClass="{
      main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
    }"
  />
</template>
