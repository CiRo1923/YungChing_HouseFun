<script setup>
import Container from '@pages/buy/_components/house/information/_Container.vue'

import { useHouseStore } from '@stores/buy/house.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const house = useHouseStore()
const { onValueGetText } = useProjectStores()
const { basic, floor } = storeToRefs(house)

const items = computed(() => {
  const { caseType, layout, buildAge } = basic.value
  const { from, to, up } = floor.value // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const isSameFloorFromTo = from === to
  const addonData = {
    room: addon.room ? ` ${addon.room} 房 (室)` : '',
    living: addon.living ? ` ${addon.living} 廳` : '',
    bath: addon.bath ? ` ${addon.bath} 衛` : '',
  }

  return [
    [
      {
        id: 'mainLayout',
        label: '建物格局',
        values: [
          {
            content: `${room} 房 (室) ${living} 廳 ${bath} 衛`,
          },
        ],
      },
      {
        id: 'addonLayout',
        label: '加蓋格局',
        values: [
          {
            content: hasAddon ? `${addonData.room}${addonData.living}${addonData.bath}` : null,
          },
        ],
      },
      {
        id: 'buildAge',
        label: '屋齡',
        values: [
          {
            content: `${buildAge} 年`,
          },
        ],
      },
      {
        id: 'floor',
        label: '樓層',
        values: [
          {
            content: `${from}${!isSameFloorFromTo ? ` ~ ${to}` : ''} / ${up} 樓`,
            button: {
              text: '是否有其他樓層物件',
              icon: 'icon_question_dialog',
              class: {
                main: '--text-orange-e646 p:text-[14px]',
              },
            },
            isFlex: true,
          },
        ],
      },
    ],
    [
      {
        id: 'usage',
        label: '法定用途',
        values: [],
      },
      {
        id: 'type',
        label: '型態',
        values: [
          {
            content: onValueGetText('caseType', caseType),
          },
        ],
      },
      {
        id: 'community',
        label: '建物社區',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <!-- <pre>
    {{ basic }}
  </pre> -->
  <Container name="basic" :items="items" />
</template>

<style></style>
