<script setup>
const memberCenter = useMemberCenterStore()
const { account } = storeToRefs(memberCenter)

const apiData = computed(() => account.value.apiData)
</script>

<template>
  <div class="space-y-[10px]">
    <div class="grid grid-cols-2 gap-x-[10px]">
      <CommonMFormInput
        name="lastName"
        v-model="apiData.lastName"
        :config="{
          placeholder: '姓',
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '必填項目，請輸入您的姓氏',
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
        }"
      />
      <CommonMFormInput
        name="firstName"
        v-model="apiData.firstName"
        :config="{
          placeholder: '名',
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '必填項目，請輸入您的名字',
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
        }"
      />
    </div>
    <CommonMFormInput
      name="email"
      v-model="apiData.email"
      :config="{
        placeholder: 'E-Mail',
        validateEvents: ['blur', 'change'],
      }"
      :rules="{
        required: '必填項目，請輸入您的E-Mail',
        email: '請輸入正確的E-Mail格式',
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
  </div>
</template>
