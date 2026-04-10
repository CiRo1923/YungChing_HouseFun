<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'
import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'

const buyHouse = useBuyHouseStore()
const { basic, floor, community } = storeToRefs(buyHouse)
const { onSearchParams } = useBuyProjectStores()

const emits = defineEmits(['popup'])
const items = computed(() => {
  const { caseType, layout, buildAge, caseUsageToken } = basic.value
  const { from, to, up } = floor.value // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const { name: communityName, cta } = community.value
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
            popupAnchor: {
              text: '是否有其他樓層物件',
              icon: 'icon_question_dialog',
              class: {
                main: '--text-orange-e646 text-[14px] ',
              },
              onClick: () => {
                emits('popup', 'askMessage')
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
        values: [
          {
            content: caseUsageToken,
          },
        ],
      },
      {
        id: 'type',
        label: '型態',
        values: [
          {
            content: caseType,
          },
        ],
      },
      {
        id: 'community',
        label: '建物社區',
        values: [
          {
            anchor: {
              text: communityName,
              to: {
                path: cta,
                query: onSearchParams(cta) || {},
              },
            },
            popupAnchor: communityName
              ? {
                  text: '社區行情趨勢',
                  icon: 'icon_question_dialog',
                  class: {
                    main: '--text-orange-e646 text-[14px] ',
                  },
                  onClick: () => {
                    emits('popup', 'askMessage')
                  },
                }
              : null,
            isFlex: true,
          },
        ],
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
