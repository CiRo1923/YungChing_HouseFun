<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const basicInfo = computed(() => {
  const { caseType, buildAge, floor, layout } = props.item
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
    },
    {
      id: 'layout',
      label: '格局',
      value: layoutValue,
      isHidden: !layoutValue,
    },
  ]
})
</script>

<template>
  <BuyMSeparator
    :items="basicInfo"
    :setClass="{
      main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
    }"
  />
</template>

<style lang="postcss"></style>
