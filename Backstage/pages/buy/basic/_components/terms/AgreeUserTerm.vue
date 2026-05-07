<script setup>
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
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
    我已詳閱並同意
    <a href="javascript:;" class="text-[--green-6a2d] underline">好房會員服務使用條款</a>
  </BuyMFormCheckBox>
</template>

<style></style>
