<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormInput
    name="agentLine"
    v-model="apiData.posterInfo.agentLine"
    :config="{
      inputChinese: false,
      isDisabled: apiData.posterDataSourceToken === '1',
    }"
    :rules="{
      custom: {
        valid: /^https:\/\/line\.me/.test(apiData.posterInfo.agentLine),
        errorMessage: '請輸入正確 LINE 聯絡網址',
      },
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
      element: 'grow',
    }"
  />
</template>

<style></style>
