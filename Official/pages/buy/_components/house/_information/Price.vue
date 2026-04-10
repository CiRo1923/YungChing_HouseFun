<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { numberComma } from '@js/_prototype.js'

import { useBuyHouseStore } from '@stores/buy/house.js'
// import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'

const buyHouse = useBuyHouseStore()
const { pricing } = storeToRefs(buyHouse)
// const { onValueGetText } = useBuyProjectStores()

const emits = defineEmits(['popup'])
const items = computed(() => {
  const { unitPrice, mortgageMonth } = pricing.value

  return [
    [
      {
        id: 'priceUnit',
        label: '單價',
        values: [
          {
            content: `${numberComma.add(unitPrice)} 萬`,
            popupAnchor: {
              text: '有議價空間嗎',
              icon: 'icon_question_dialog',
              class: {
                main: '--text-orange-e646 text-[14px]',
              },
              onClick: () => {
                emits('popup', 'askMessage')
              },
            },
          },
        ],
      },
    ],
    [
      {
        id: 'loan',
        label: '房貸月付',
        values: [
          {
            content: `約 ${numberComma.add(mortgageMonth)} 元`,
            popupAnchor: {
              text: '貸款試算',
              icon: 'icon_calculator',
              class: {
                main: 'p:text-[16px] tm:text-[14px]',
              },
            },
            isFlex: true,
          },
        ],
      },
    ],
  ]
})
</script>

<template>
  <Container name="price" :items="items" />
</template>

<style></style>
