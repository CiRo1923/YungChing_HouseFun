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
    name="caseTypeToken"
    v-model="apiData.caseInfo.caseTypeToken"
    :options="options.caseType"
    :config="{
      placeholder: '請選擇型態',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :rules="{
      required: '請選擇型態',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
