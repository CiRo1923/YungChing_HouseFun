<script setup>
import { onToFixed } from '@js/_prototype.js'

const buyHouse = useBuyHouseStore()
const { basic, pin } = storeToRefs(buyHouse)

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

  const outbuildings = [
    { label: '陽台', value: balcony },
    { label: '平台', value: platform },
    { label: '露臺', value: terrace },
    { label: '電 / 樓梯間', value: stairwell },
    { label: '夾層', value: mezzanine },
    { label: '地下室', value: basement },
    { label: '其他', value: other },
  ]
    .filter(({ value }) => !isHidden(value))
    .map(({ label, value }) => `${label}${value} 坪`)
    .join('、')

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
        id: 'mainSq',
        label: '主建物',
        values: [
          {
            content: `${main} ${unit}`,
          },
        ],
      },
      {
        id: 'mainAddBalcony',
        label: '共同使用',
        values: [
          {
            content: `${onToFixed([main, balcony])} ${unit}`,
          },
        ],
      },

      {
        id: 'affiliated',
        label: '附屬建物',
        values: [
          {
            content: totalAttached
              ? `${totalAttached} ${unit}${outbuildings ? ` (${outbuildings})` : ''}`
              : null,
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
        label: '土地分區',
        values: [
          {
            content: caseZoingCity,
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
  <PageBuyHouseInformationContainer name="pin" :items="items" />
</template>

<style></style>
