<script setup>
import { Form } from 'vee-validate'

const memberForget = useMemberForgetStore()
const { resetPassword } = storeToRefs(memberForget)

const emits = defineEmits(['submit'])
const apiData = computed(() => resetPassword.value.apiData)

const onSumit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px]" v-slot="{ validate }">
    <PageMemberForgetNote message="請設定新密碼" />
    <CommonMFormPassword
      name="newPassword"
      v-model="apiData.newPassword"
      :config="{
        minlength: 6,
        maxlength: 12,
        placeholder: '6 ~ 12 位數字或英文，大小寫有別',
        validateEvents: ['blur', 'change'],
      }"
      :rules="{
        required: '請設定密碼',
        custom: {
          // 6~12 位數字或英文（大小寫有別）
          valid: /^[A-Za-z0-9]{6,12}$/.test(apiData.newPassword),
          errorMessage: '請輸入 { minlength } ~ { maxlength } 位數字或英文，大小寫有別',
        },
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
    <CommonMFormPassword
      name="confirmPassword"
      v-model="apiData.confirmPassword"
      :config="{
        placeholder: '再次輸入密碼',
        validateEvents: ['blur', 'change'],
      }"
      :rules="{
        required: '再次輸入密碼',
        custom: {
          valid: apiData.newPassword === apiData.confirmPassword,
          errorMessage: '密碼與再次輸入密碼不同',
        },
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
    <CommonMAnchor
      text="下一步"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate)"
    />
  </Form>
</template>
