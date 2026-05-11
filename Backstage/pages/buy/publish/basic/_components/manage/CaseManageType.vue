<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormSelect
    name="caseManageTypeToken"
    v-model.number="apiData.caseInfo.caseManageTypeToken"
    :options="options.manageType"
    :config="{
      placeholder: {
        value: '請選擇管理方式',
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
