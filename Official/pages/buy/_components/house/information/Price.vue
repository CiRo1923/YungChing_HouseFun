<script setup>
import { numberComma } from '@js/_prototype.js'

const buyHouse = useBuyHouseStore()
const { pricing } = storeToRefs(buyHouse)

const emits = defineEmits(['popup'])
const items = computed(() => {
  const { unitPrice, mortgageMonth } = pricing.value

  return [
    [
      {
        id: 'loan',
        label: '房貨試算',
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
            isFlex: true,
          },
        ],
      },
    ],
  ]
})
</script>

<template>
  <PageBuyHouseInformationContainer name="price" :items="items" />
</template>

<style></style>
