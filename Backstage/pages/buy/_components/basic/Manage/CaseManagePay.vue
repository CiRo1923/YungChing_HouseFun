<script setup>
import FormSelect from '@components/buy/mForm/Select.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)
</script>

<template>
  <ul class="pt:flex pt:gap-x-[8px]">
    <li>
      <FormSelect
        name="caseManageFeePeriodToken"
        v-model="apiData.caseManageFeePeriodToken"
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
          main: '--height-40 --px-12 --py-8 p:w-[270px]',
        }"
      />
    </li>
    <li>
      <FormInput
        name="caseManageFee"
        v-model="apiData.caseManageFee"
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
          main: '--height-40 --px-12 --py-8 p:w-[270px]',
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
