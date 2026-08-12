<script setup>
const memberUpgrade = useMemberUpgradeStore()
const { index } = storeToRefs(memberUpgrade)
const apiData = computed(() => index.value.apiData)
</script>

<template>
  <CommonMFormInput
    name="email"
    v-model="apiData.email"
    :config="{
      placeholder: '請輸入 E-MAIL 帳號',
      inputMode: 'email',
      inputChinese: false,
    }"
    :rules="{
      required: '請輸入 E-MAIL 帳號',
      email: '手機號碼格式錯誤',
    }"
    :setClass="{
      main: '--rounded --h-55 --px-12',
    }"
  />
</template>

<style lang="postcss"></style>
