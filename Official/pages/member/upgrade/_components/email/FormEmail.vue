<script setup>
const memberUpgrade = useMemberUpgradeStore()
const { email } = storeToRefs(memberUpgrade)

const emits = defineEmits(['enter'])
const apiData = computed(() => email.value.apiData)

const onEnter = () => {
  emits('enter')
}
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
      email: 'E-MAIL 格式錯誤',
    }"
    :setClass="{
      main: '--rounded --h-55 --px-12',
    }"
    @enter="onEnter"
  />
</template>
