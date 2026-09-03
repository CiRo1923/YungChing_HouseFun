<script setup>
import { Form } from 'vee-validate'

const emits = defineEmits(['submit'])

// TODO: API 未定,先用頁面內的 model 撐畫面;
// 之後改由 stores/member/forget 的 apiData 接管(欄位名跟著 API 走)。
const apiData = ref({
  password: null,
  passwordConfirm: null,
})

// 6~12 位數字或英文,大小寫有別(設計稿的 placeholder 文案)
const PASSWORD_RE = /^[0-9a-zA-Z]{6,12}$/

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
      name="password"
      v-model="apiData.password"
      :config="{
        placeholder: '6~12位數字或英文，大小寫有別',
        validateEvents: ['blur', 'change'],
      }"
      :rules="{
        required: '請輸入密碼',
        custom: {
          valid: PASSWORD_RE.test(apiData.password ?? ''),
          errorMessage: '密碼格式錯誤',
        },
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
    <CommonMFormPassword
      name="passwordConfirm"
      v-model="apiData.passwordConfirm"
      :config="{
        placeholder: '再次輸入密碼',
        validateEvents: ['blur', 'change'],
      }"
      :rules="{
        required: '請再次輸入密碼',
        custom: {
          valid: !!apiData.passwordConfirm && apiData.passwordConfirm === apiData.password,
          errorMessage: '密碼格式錯誤',
        },
      }"
      :setClass="{
        main: '--rounded --h-55 --px-12',
      }"
    />
    <CommonMAnchor
      text="確定修改"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate)"
    />
  </Form>
</template>
