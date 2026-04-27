<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
</script>

<template>
  <BuyMFormRadiosOval
    name="casePurposeToken"
    v-model.number="apiData.caseInfo.casePurposeToken"
    :options="options.casePurpose"
    :config="{
      schema: {
        label: 'text',
        value: 'code',
      },
    }"
    :rules="{
      required: '請選擇現況',
    }"
  />
</template>

<style></style>
