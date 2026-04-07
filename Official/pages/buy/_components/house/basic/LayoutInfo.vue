<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import Separator from '@components/buy/mSeparator.vue'

import { useHouseStore } from '@stores/buy/house.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const house = useHouseStore()
const { onValueGetText } = useProjectStores()
const { basic, floor } = storeToRefs(house)

const layoutInfo = computed(() => {
  const { caseType, layout } = basic.value
  const { from, to, up } = floor.value // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const isSameFloorFromTo = from === to
  const addonData = {
    room: addon.room ? ` ${addon.room} 房 (室)` : '',
    living: addon.living ? ` ${addon.living} 廳` : '',
    bath: addon.bath ? ` ${addon.bath} 衛` : '',
  }

  return [
    {
      id: 'house',
      icon: 'icon_house',
      items: [
        {
          id: 'caseType',
          label: '型態',
          value: onValueGetText('caseType', caseType).text,
        },
        {
          id: 'floor',
          label: '樓層',
          value: `${from}${!isSameFloorFromTo ? ` ~ ${to}` : ''} / ${up} 樓`,
        },
      ],
    },
    {
      id: 'layout',
      icon: 'icon_layout',
      value: {
        main: `${room} 房 (室) ${living} 廳 ${bath} 衛`,
        addon: hasAddon ? ` 含加蓋${addonData.room}${addonData.living}${addonData.bath}` : null,
      },
    },
  ]
})
</script>

<template>
  <ul class="space-y-[5px] tm:text-[16px] p:text-[18px]">
    <li
      class="flex items-center gap-x-[5px]"
      v-for="(item, index) in layoutInfo"
      :key="`${item.id}_${index}`"
    >
      <SvgIcon :icon="item.icon" class="h-[18px] w-[18px] text-[--green-8b0d]" />
      <Separator
        :items="item.items"
        :setClass="{
          main: '--horizontal p:--gap-x-25 tm:--gap-x-20',
        }"
        v-if="item.id === 'house'"
      />
      <p v-if="item.id === 'layout'">
        {{ item.value.main }} <small v-if="item.value.addon">{{ item.value.addon }}</small>
      </p>
    </li>
  </ul>
</template>

<style></style>
