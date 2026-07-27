<script setup>
const emits = defineEmits(['verifySubmit', 'cityChange'])

const items = computed(() => [
  {
    label: {
      type: 'string',
      text: '手機號碼',
    },
    forms: [
      {
        name: 'mobilePhone',
      },
      {
        name: 'verifyCode',
      },
    ],
  },
  {
    label: {
      type: 'string',
      text: '設定密碼',
    },
    forms: [
      {
        name: 'password',
      },
      {
        name: 'confirmPassword',
      },
    ],
  },
  {
    label: {
      type: 'string',
      text: '姓名',
    },
    forms: [
      {
        name: 'name',
      },
    ],
  },
  {
    label: {
      type: 'string',
      text: 'E-MAIL',
    },
    forms: [
      {
        name: 'email',
      },
    ],
  },
  {
    label: {
      type: 'string',
      text: '連絡地址',
    },
    forms: [
      {
        name: 'address',
      },
    ],
  },
  {
    forms: [
      {
        name: 'agreeTerms',
      },
    ],
  },
])

const onVerifySubmit = () => {
  emits('verifySubmit')
}

const onCityChange = (cityid) => {
  emits('cityChange', cityid)
}
</script>

<template>
  <PageMemberRegisterTypeForms
    :items="items"
    @verifySubmit="onVerifySubmit"
    @cityChange="onCityChange"
  />
</template>

<style lang="postcss"></style>
