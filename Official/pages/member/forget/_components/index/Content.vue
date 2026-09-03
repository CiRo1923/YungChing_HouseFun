<script setup>
import { Form } from 'vee-validate'

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const memberForget = useMemberForgetStore()
const { verify } = storeToRefs(memberForget)

const emits = defineEmits(['sendCode', 'submit'])
const apiData = computed(() => verify.value.apiData)
const isPhoneValid = computed(() => /^09\d{8}$/.test(apiData.value.mobilePhone ?? ''))

const onSendCode = () => {
  emits('sendCode')
}

// 驗證碼是 confirm(步驟 2)才驗的,這裡只能確認格式與「有沒有發過碼」——
// 沒有 resetToken 就代表沒發過,讓錯誤落在驗證碼欄位上,而不是放人進下一步空等。
const onSumit = async (validate, setFieldError) => {
  const { valid } = await validate()

  if (!valid) return

  if (!apiData.value.resetToken) {
    setFieldError('verificationCode', '請先發送驗證碼')
    return
  }

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px]" v-slot="{ validate, setFieldError }">
    <PageMemberForgetNote message="忘記密碼每天只能使用2次" />
    <CommonMFormInput
      name="mobilePhone"
      v-model="apiData.mobilePhone"
      :config="{
        placeholder: '請輸入註冊的手機號碼',
        validateEvents: ['blur', 'change'],
        inputMode: 'tel',
        length: 10,
        inputChinese: false,
        integer: true,
      }"
      :rules="{
        required: '請輸入手機號碼',
        phone: '手機號碼格式錯誤',
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
    <CommonMFormVerifyCountdown
      name="verificationCode"
      v-model="apiData.verificationCode"
      :config="{
        length: 6,
        placeholder: '請輸入6位數驗證碼',
        validateEvents: ['blur', 'change'],
        serverTime: serverTime?.full,
        expires: verify.countdownData.expires,
        message: {
          timeout: '{timeout}s後重發',
          reSend: '發送驗證碼',
        },
        isDisabled: {
          button: !isPhoneValid,
        },
      }"
      :rules="{
        required: '請輸入驗證碼',
        minlength: '請輸入 {length} 位數驗證碼',
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
        button: '--h-35 --px-15',
      }"
      @submit="onSendCode"
    />
    <CommonMAnchor
      text="下一步"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate, setFieldError)"
    />
  </Form>
</template>
