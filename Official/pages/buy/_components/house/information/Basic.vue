<script setup>
import { onLayoutText, onUnitText, onFloorText } from '@js/_projectPrototype.js'

const buyHouse = useBuyHouseStore()
const { basic, floor, community } = storeToRefs(buyHouse)
const { onSearchParams } = useBuyProjectActions()

const emits = defineEmits(['popup'])
const items = computed(() => {
  const { caseType, layout, buildAge, caseUsageToken } = basic.value
  const { from, to, up } = floor.value // 樓層
  const { addon, hasAddon } = layout
  const { name: communityName, cta } = community.value
  const addonData = {
    room: addon.room ? ` ${addon.room} 房 (室)` : '',
    living: addon.living ? ` ${addon.living} 廳` : '',
    bath: addon.bath ? ` ${addon.bath} 衛` : '',
  }

  return [
    [
      {
        id: 'caseType',
        label: '型態',
        values: [
          {
            content: caseType,
          },
        ],
      },
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
        id: 'mainLayout',
        label: '建物格局',
        values: [
          {
            content: onLayoutText(layout),
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
    ],
    [
      {
        id: 'floor',
        label: '樓層',
        values: [
          {
            content: onFloorText({ from, to, up }),
            popupAnchor: {
              text: '是否有其他樓層物件',
              icon: 'icon_question_dialog',
              class: {
                main: '--text-orange-e646 text-[14px] ',
              },
              onClick: () => {
                emits('popup', 'popupMessage')
              },
            },
            isFlex: true,
          },
        ],
      },

      {
        id: 'buildAge',
        label: '屋齡',
        values: [
          {
            content: onUnitText(buildAge, ' 年'),
          },
        ],
      },
      {
        id: 'community',
        label: '社區',
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
                    emits('popup', 'popupMessage')
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
  <PageBuyHouseInformationContainer name="basic" :items="items" />
</template>

<style></style>
