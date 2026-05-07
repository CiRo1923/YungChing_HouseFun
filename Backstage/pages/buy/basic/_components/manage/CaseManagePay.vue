<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
    <li class="t:w-[220px] p:w-[270px]">
      <BuyMFormSelect
        name="caseManageFeePeriodToken"
        v-model.number="apiData.caseInfo.caseManageFeePeriodToken"
        :options="options.managePay"
        :config="{
          placeholder: {
            value: '請選擇繳費方式',
            isToOption: true,
          },
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
        }"
      />
    </li>
    <li class="t:w-[220px] p:w-[270px]">
      <BuyMFormInput
        name="caseManageFee"
        v-model.number="apiData.caseInfo.caseManageFee"
        :config="{
          isDisabled: !apiData.caseInfo.caseManageFeePeriodToken,
        }"
        :rules="{
          required: {
            valid: apiData.caseInfo.caseManageFeePeriodToken,
            errorMessage: '請輸入管理費',
          },
        }"
        :setClass="{
          main: '--h-40 --px-12 --py-8',
          element: 'grow',
          rearAssist: 'text-[14px] text-[--gray-999]',
        }"
      >
        <template #rearAssist>元</template>
      </BuyMFormInput>
    </li>
  </ul>
</template>

<style></style>
