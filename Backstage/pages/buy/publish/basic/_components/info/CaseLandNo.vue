<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormInput
    name="caseLandNo"
    v-model="apiData.caseInfo.caseLandNo"
    :config="{
      placeholder: '請輸入地號',
    }"
    :rules="{
      required: '請輸入地號',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>

<style></style>
