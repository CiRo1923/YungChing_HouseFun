<script setup>
const emits = defineEmits(['verifySubmit'])

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
      text: 'E-MAIL',
    },
    forms: [
      {
        name: 'email',
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
</script>

<template>
  <PageMemberRegisterTypeForms :items="items" @verifySubmit="onVerifySubmit" />
</template>
