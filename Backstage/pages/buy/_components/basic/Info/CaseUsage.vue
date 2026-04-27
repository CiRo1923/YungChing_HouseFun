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
    name="caseUsageToken"
    v-model="apiData.caseInfo.caseUsageToken"
    :options="options.caseUsage"
    :config="{
      placeholder: '請選擇法定用途',
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :rules="{
      required: '請選擇法定用途',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
