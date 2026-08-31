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
            content: mortgageMonth != null ? `約 ${numberComma.add(mortgageMonth)} 元` : null,
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
            // 規格:單價無資料時顯示「請洽房仲人員」,而非隱藏或 null
            content: unitPrice != null ? `${numberComma.add(unitPrice)} 萬` : '請洽房仲人員',
            popupAnchor: {
              text: '有議價空間嗎',
              icon: 'icon_question_dialog',
              class: {
                main: '--text-orange-e646 text-[14px]',
              },
              onClick: () => {
                emits('popup', 'popupMessage')
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
