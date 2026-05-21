<script setup>
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormInput
    name="agentLine"
    v-model="apiData.caseInfo.posterInfo.agentLine"
    :config="{
      inputChinese: false,
      isDisabled: apiData.caseInfo.posterDataSourceToken === 1,
    }"
    :rules="{
      custom: {
        valid: /^https:\/\/line\.me/.test(apiData.caseInfo.posterInfo.agentLine),
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
