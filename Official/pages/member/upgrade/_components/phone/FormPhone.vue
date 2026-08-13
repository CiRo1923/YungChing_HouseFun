<script setup>
const memberUpgrade = useMemberUpgradeStore()
const { phone } = storeToRefs(memberUpgrade)

const emits = defineEmits(['enter'])
const apiData = computed(() => phone.value.apiData)

const onEnter = () => {
  emits('enter')
}
</script>

<template>
  <CommonMFormInput
    name="mobilePhone"
    v-model="apiData.mobilePhone"
    :config="{
      placeholder: '手機號碼 09',
      inputMode: 'tel',
      length: 10,
      inputChinese: false,
    }"
    :rules="{
      required: '請輸入手機號碼',
      phone: '手機號碼格式錯誤',
    }"
    :setClass="{
      main: '--rounded --h-55 --px-12',
    }"
    @enter="onEnter"
  />
</template>

<style lang="postcss"></style>
