<script setup>
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
        label: '建物結構',
        values: [
          {
            content: caseStructureToken,
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
        id: 'elevator',
        label: '電梯數量',
        values: [
          {
            content: isCaseHasElevator ? `${caseElevatorCount} 部` : null,
          },
        ],
      },
      {
        id: 'face',
        label: '朝向',
        values: [
          {
            content: caseFaceToken,
          },
        ],
      },
    ],
  ]
})
</script>

<template>
  <PageBuyHouseInformationContainer name="other" :items="items" />
</template>

<style></style>
