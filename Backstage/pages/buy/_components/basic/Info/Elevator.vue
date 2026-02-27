<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import FormInput from '@components/buy/mForm/Input.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)

const radioOptions = readonly([
  {
    label: '無電梯',
    value: false,
  },
  {
    label: '有電梯',
    value: true,
  },
])

const onIsCaseHasElevatorChnage = () => {
  if (!apiData.value.isCaseHasElevator) {
    apiData.value.caseElevatorCount = ''
  }
}
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="isCaseHasElevator"
      v-model="apiData.isCaseHasElevator"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onIsCaseHasElevatorChnage"
    />
    <ul>
      <li>
        <FormInput
          name="caseElevatorCount"
          v-model="apiData.caseElevatorCount"
          :config="{
            isExistClose: false,
            maxlength: 3,
            isDisabled: !apiData.isCaseHasElevator,
          }"
          :rules="{
            required: {
              valid: apiData.isCaseHasElevator,
              errorMessage: '請輸入電梯數量',
            },
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 p:w-[100px]',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
        >
          <template #rearAssist>部</template>
        </FormInput>
      </li>
    </ul>
  </RadiosOval>
</template>

<style></style>
