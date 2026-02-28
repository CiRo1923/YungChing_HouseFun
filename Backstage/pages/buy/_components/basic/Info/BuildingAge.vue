<script setup>
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'
import FormInput from '@components/buy/mForm/Input.vue'
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
const optionsModel = ref('age')
const isOptionsModelAge = computed(() => optionsModel.value === 'age')
const radioOptions = readonly([
  {
    label: '屋齡',
    value: 'age',
  },
  {
    label: '完工日期',
    value: 'date',
  },
])

const onBuildingAgeChange = () => {
  if (isOptionsModelAge.value) {
    apiData.value.caseCompletedYear = ''
    apiData.value.caseCompletedMonth = ''
  } else {
    apiData.value.caseAge = ''
  }
}

const onClearCheckbox = () => {
  apiData.value.isCaseUnknownAge = false
  apiData.value.isCasePreSale = false
}

const onReset = () => {
  apiData.value.caseAge = ''
  apiData.value.caseCompletedYear = ''
  apiData.value.caseCompletedMonth = ''
}
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="buildingAge"
      v-model="optionsModel"
      :options="radioOptions"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
      @change="onBuildingAgeChange"
    />
    <ul class="flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]">
      <li class="tm:w-[130px] p:w-[100px]" v-if="isOptionsModelAge">
        <FormInput
          name="caseAge"
          v-model="apiData.caseAge"
          :config="{
            isExistClose: false,
            maxlength: 3,
          }"
          :rules="{
            required: {
              valid: !apiData.isCaseUnknownAge && !apiData.isCasePreSale,
              errorMessage: '請輸入屋齡',
            },
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8',
            element: 'grow',
            rearAssist: 'text-[14px] text-[--gray-999]',
          }"
          @input="onClearCheckbox"
        >
          <template #rearAssist>年</template>
        </FormInput>
      </li>
      <li v-else>
        <ul class="gap-x-[8px] m:grid m:grid-cols-2 pt:flex">
          <li class="pt:w-[120px]">
            <FormInput
              name="caseCompletedYear"
              v-model="apiData.caseCompletedYear"
              :config="{
                isExistClose: false,
                maxlength: 3,
              }"
              :rules="{
                required: {
                  valid: !apiData.isCaseUnknownAge && !apiData.isCasePreSale,
                  errorMessage: '請輸入完工年份',
                },
              }"
              :setClass="{
                main: '--h-40 --px-12 --py-8',
                element: 'grow',
                frontAssist: 'text-[14px] text-[--gray-999]',
                rearAssist: 'text-[14px] text-[--gray-999]',
              }"
              @input="onClearCheckbox"
            >
              <template #frontAssist>民國</template>
              <template #rearAssist>年</template>
            </FormInput>
          </li>
          <li class="pt:w-[100px]">
            <FormInput
              name="caseCompletedMonth"
              v-model="apiData.caseCompletedMonth"
              :config="{
                isExistClose: false,
                maxlength: 2,
              }"
              :rules="{
                required: {
                  valid: !apiData.isCaseUnknownAge && !apiData.isCasePreSale,
                  errorMessage: '請輸入完工月份',
                },
              }"
              :setClass="{
                main: '--h-40 --px-12 --py-8',
                element: 'grow',
                rearAssist: 'text-[14px] text-[--gray-999]',
              }"
              @input="onClearCheckbox"
            >
              <template #rearAssist>月</template>
            </FormInput>
          </li>
        </ul>
      </li>
      <li class="flex h-[40px] items-center">
        <FormCheckBox
          name="isCaseUnknownAge"
          v-model="apiData.isCaseUnknownAge"
          :config="{
            mode: 'boolean',
            label: '屋齡不詳',
          }"
          :setClass="{
            label: 'text-[16px]',
          }"
          @change="onReset"
        />
      </li>
      <li class="flex h-[40px] items-center">
        <FormCheckBox
          name="isCasePreSale"
          v-model="apiData.isCasePreSale"
          :config="{
            mode: 'boolean',
            label: '預售屋',
          }"
          :setClass="{
            label: 'text-[16px]',
          }"
          @change="onReset"
        />
      </li>
    </ul>
  </RadiosOval>
</template>

<style></style>
