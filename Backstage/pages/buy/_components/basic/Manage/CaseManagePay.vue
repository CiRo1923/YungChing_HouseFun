<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <ul class="m:space-y-[12px] pt:flex pt:gap-x-[8px]">
    <li class="t:w-[220px] p:w-[270px]">
      <FormSelect
        name="caseManageFeePeriodToken"
        v-model.number="apiData.caseManageFeePeriodToken"
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
      <FormInput
        name="caseManageFee"
        v-model.number="apiData.caseManageFee"
        :config="{
          isDisabled: !apiData.caseManageFeePeriodToken,
        }"
        :rules="{
          required: {
            valid: apiData.caseManageFeePeriodToken,
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
      </FormInput>
    </li>
  </ul>
</template>

<style></style>
