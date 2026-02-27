<script setup>
import FormInput from '@components/buy/mForm/Input.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyProject)
const { posterInfoImport } = storeToRefs(buyBasic)
</script>

<template>
  <FormInput
    name="agentLine"
    v-model="apiData.posterInfo.agentLine"
    :config="{
      inputChinese: false,
      isDisabled: posterInfoImport === 'same',
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
