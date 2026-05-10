<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <BuyMFormSelect
    name="caseManageDutyToken"
    v-model.number="apiData.caseInfo.caseManageDutyToken"
    :options="options.manageDuty"
    :config="{
      placeholder: {
        value: '請選擇管理時段',
        isToOption: true,
      },
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8 t:w-[220px] p:w-[270px]',
    }"
  />
</template>

<style></style>
