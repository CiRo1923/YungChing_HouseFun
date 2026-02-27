<script setup>
import FormCheckBox from '@components/buy/mForm/CheckBox.vue'

const isAgree = ref(false)
</script>

<template>
  <FormCheckBox
    name="isAgree"
    v-model="isAgree"
    :config="{
      value: {
        true: true,
        false: false,
      },
    }"
    :rules="{
      required: {
        valid: isAgree === false,
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
