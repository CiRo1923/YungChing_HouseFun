<script setup>
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
</script>

<template>
  <FormCheckBox
    name="isAgreeUserTerm"
    v-model="apiData.isAgreeUserTerm"
    :config="{
      mode: 'boolean',
    }"
    :rules="{
      required: {
        valid: apiData.isAgreeUserTerm === false,
        errorMessage: '請勾選並同意好房會員服務使用條款',
      },
    }"
    :setClass="{
      label: 'text-[16px]',
    }"
  >
    我已詳閱並同意
    <a href="javascript:;" class="text-[--green-6a2d] underline">好房會員服務使用條款</a>
  </FormCheckBox>
</template>

<style></style>
