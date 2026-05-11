<script setup>
import { useBuyPublishStore } from '@stores/buy/publish.js'

const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <BuyMFormCheckBox
    name="isAgreeUserTerm"
    v-model="apiData.caseInfo.isAgreeUserTerm"
    :config="{
      mode: 'boolean',
    }"
    :rules="{
      required: {
        valid: apiData.caseInfo.isAgreeUserTerm === false,
        errorMessage: '請勾選並同意好房會員服務使用條款',
      },
    }"
    :setClass="{
      label: 'text-[16px]',
    }"
  >
    <p>
      我已詳閱並同意
      <a href="javascript:;" class="text-[--green-6a2d] underline">好房會員服務使用條款</a>
    </p>
  </BuyMFormCheckBox>
</template>

<style></style>
