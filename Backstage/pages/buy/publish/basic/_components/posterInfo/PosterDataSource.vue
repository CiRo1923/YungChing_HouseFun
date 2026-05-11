<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormRadiosOval
    name="posterDataSourceToken"
    v-model.number="apiData.caseInfo.posterDataSourceToken"
    :options="options.posterDataSource"
    :config="{
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      radios: 'm:w-full',
      container: 'm:flex-1',
    }"
  />
</template>

<style></style>
