<script setup>
const emits = defineEmits(['verifySubmit', 'cityChange', 'workAreaChange', 'workBrandChange'])
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
      type: 'line',
      text: '服務店資料',
    },
    forms: [
      {
        name: 'store',
      },
    ],
  },
  {
    label: {
      type: 'string',
      text: '經紀業',
    },
    forms: [
      {
        name: 'companyName',
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

const onCityChange = (cityId) => {
  emits('cityChange', cityId)
}

const onAreaChange = ({ cityId, areaId }) => {
  emits('workAreaChange', { cityId, areaId })
}

const onBrandChange = ({ cityId, areaId, brandId }) => {
  emits('workBrandChange', { cityId, areaId, brandId })
}
</script>

<template>
  <PageMemberRegisterTypeForms
    :items="items"
    @verifySubmit="onVerifySubmit"
    @cityChange="onCityChange"
    @workAreaChange="onAreaChange"
    @workBrandChange="onBrandChange"
  />
</template>
