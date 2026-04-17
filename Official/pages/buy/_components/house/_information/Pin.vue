<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { onToFixed } from '@js/_prototype.js'

import { useBuyHouseStore } from '@stores/buy/house.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const buyHouse = useBuyHouseStore()
const { basic, pin } = storeToRefs(buyHouse)
const { onValueGetText } = useBuyProjectActions()

const items = computed(() => {
  const unit = '坪'
  const { caseAmenitieSq, caseZoingCity } = basic.value
  const {
    build,
    main,
    balcony,
    totalAttached,
    platform,
    terrace,
    stairwell,
    mezzanine,
    basement,
    other,
    land,
  } = pin.value
  const isHidden = (value) => value === '0' || !value

  return [
    [
      {
        id: 'build',
        label: '建物坪數',
        values: [
          {
            content: `${build} ${unit}`,
          },
        ],
      },
      {
        id: 'mainAddBalcony',
        label: '主 + 陽',
        values: [
          {
            content: `${onToFixed([main, balcony])} ${unit}`,
          },
        ],
      },
      {
        id: 'mainSq',
        label: '主建物',
        values: [
          {
            content: `${main} ${unit}`,
          },
        ],
      },
      {
        id: 'affiliated',
        label: '附屬建物',
        values: [
          {
            content: `${totalAttached} ${unit}`,
          },
        ],
        children: [
          {
            id: 'balcony',
            label: '陽台',
            values: [
              {
                content: `${balcony} ${unit}`,
              },
            ],
            isHidden: isHidden(balcony),
          },
          {
            id: 'platform',
            label: '平台',
            values: [
              {
                content: `${platform}  ${unit}`,
              },
            ],
            isHidden: isHidden(platform),
          },
          {
            id: 'terrace',
            label: '露臺',
            values: [
              {
                content: `${terrace} ${unit}`,
              },
            ],
            isHidden: isHidden(terrace),
          },
          {
            id: 'stairwell',
            label: '電 / 樓梯間',
            values: [
              {
                content: `${stairwell} ${unit}`,
              },
            ],
            isHidden: isHidden(stairwell),
          },
          {
            id: 'mezzanine',
            label: '夾層',
            values: [
              {
                content: `${mezzanine} ${unit}`,
              },
            ],
            isHidden: isHidden(mezzanine),
          },
          {
            id: 'basement',
            label: '地下室',
            values: [
              {
                content: `${basement} ${unit}`,
              },
            ],
            isHidden: isHidden(basement),
          },
          {
            id: 'other',
            label: '其他',
            values: [
              {
                content: `${other} ${unit}`,
              },
            ],
            isHidden: isHidden(other),
          },
        ],
      },
      {
        id: 'common',
        label: '共用坪數',
        values: [
          {
            content: '',
          },
        ],
      },
    ],
    [
      {
        id: 'land',
        label: '土地坪數',
        values: [
          {
            content: `${land} ${unit}`,
          },
        ],
      },
      {
        id: 'zoingCity',
        label: '土地使用分區',
        values: [
          {
            content: onValueGetText('zoingCity', caseZoingCity).text,
          },
        ],
      },
      {
        id: 'amenitieSq',
        label: '公設比',
        values: [
          {
            content: `${caseAmenitieSq} %`,
          },
        ],
      },
    ],
  ]
})
</script>

<template>
  <Container name="pin" :items="items" />
</template>

<style></style>
