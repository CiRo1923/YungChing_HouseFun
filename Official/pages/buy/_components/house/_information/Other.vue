<script setup>
import Container from '@pages/buy/_components/house/_information/_Container.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { basic, pricing } = storeToRefs(buyHouse)

const items = computed(() => {
  const {
    caseStructureToken,
    isCaseHasElevator,
    caseElevatorCount,
    caseManageTypeToken,
    caseFaceToken,
  } = basic.value
  const { caseManageFee, caseManageFeePeriodToken } = pricing.value

  return [
    [
      {
        id: 'structure',
        label: '結構',
        values: [
          {
            content: caseStructureToken,
          },
        ],
      },
      {
        id: 'elevator',
        label: '電梯',
        values: [
          {
            content: isCaseHasElevator ? caseElevatorCount : null,
          },
        ],
      },
      {
        id: 'manageType',
        label: '管理方式',
        values: [
          {
            content: caseManageTypeToken,
          },
        ],
      },
      {
        id: 'manageFeePeriod',
        label: '管理費',
        values: [
          {
            content: caseManageFeePeriodToken
              ? `${caseManageFee} / ${caseManageFeePeriodToken}`
              : null,
          },
        ],
      },
    ],
    [
      {
        id: 'face',
        label: '朝向',
        values: [
          {
            content: caseFaceToken,
          },
        ],
      },
      {
        id: 'barrierfree',
        label: '無障礙空間',
        values: [],
      },
    ],
  ]
})
</script>

<template>
  <Container name="other" :items="items" />
</template>

<style></style>
