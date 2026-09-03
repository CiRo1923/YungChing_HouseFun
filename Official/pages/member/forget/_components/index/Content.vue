<script setup>
import { Form } from 'vee-validate'

const emits = defineEmits(['sendCode', 'submit'])

// TODO: API 未定,先用頁面內的 model 撐畫面;
// 之後改由 stores/member/forget 的 apiData 接管(欄位名跟著 API 走)。
const apiData = ref({
  mobilePhone: null,
  verificationCode: null,
})

const isPhoneValid = computed(() => /^09\d{8}$/.test(apiData.value.mobilePhone ?? ''))

const onSendCode = () => {
  emits('sendCode')
}

const onSumit = async (validate) => {
  const { valid } = await validate()

  if (!valid) return

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px]" v-slot="{ validate }">
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
      @click="onSumit(validate)"
    />
  </Form>
</template>
