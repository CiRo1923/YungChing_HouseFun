<script setup>
import { numberComma } from '@js/_prototype.js'

const buyHouse = useBuyHouseStore()
const { basic, pricing } = storeToRefs(buyHouse)

// 管理費繳費週期代碼 → 文字。1 = 月(報告確認);其餘代碼待 swagger 確認後補齊。
// 找不到對應時不輸出週期文字(只顯示金額),避免顯示原始代碼。
const MANAGE_FEE_PERIOD = {
  1: '月',
  2: '季',
  3: '半年',
  4: '年',
}

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
            // 規格:「{週期}繳 {千分位金額} 元」;週期代碼查無對照時只顯示金額,不輸出原始代碼
            content: caseManageFee
              ? `${MANAGE_FEE_PERIOD[caseManageFeePeriodToken] ? `${MANAGE_FEE_PERIOD[caseManageFeePeriodToken]}繳 ` : ''}${numberComma.add(caseManageFee)} 元`
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
