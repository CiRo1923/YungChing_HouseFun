<script setup>
import { Form } from 'vee-validate'

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const buyProject = useBuyProjectStore()
const { apiVerifyCodeData, countdownData } = storeToRefs(buyProject)
const {
  onApiMessagesVerifyCode,
  onApiMessagesResendCode,
  onPopupCottonCandy,
  onPopupMessageSucess,
} = useBuyProjectActions()
const { onPromise, onCustomSettle } = usePopupActions()

const formRef = ref(null)

const onSubmit = async () => {
  // 期間以 CommonMPopupPromise 遮罩擋住操作（疊在驗證 popup 內，取代自管的防連點旗標）
  // 成功後 action 會更新 countdownData.expires → 元件內 watch expires 自動重新倒數
  onPromise('open')
  await onApiMessagesResendCode()
  onPromise('close')
}

const onSure = async () => {
  const validate = async () => await formRef.value?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才回報結果;此處不關閉,交由後續流程接手畫面
  onCustomSettle(true)
  onPromise('open')
  const { status, data } = await onApiMessagesVerifyCode()
  onPromise('close')

  if (status === 200) {
    const { cottonCandy } = data
    const hasCottonCandy = cottonCandy.items?.length !== 0

    if (!hasCottonCandy) {
      await onPopupMessageSucess()
    }

    if (hasCottonCandy) {
      await onPopupCottonCandy()
    }
  }
}
</script>

<template>
  <CommonCustomPopup
    id="popupVerifyCode"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
    @sure="onSure"
  >
    <p class="mb-[15px] text-[20px] font-medium">請輸入您收到的 6 位數驗證碼</p>
    <Form as="div" ref="formRef">
      <CommonMFormVerifyCountdown
        name="verificationCode"
        v-model="apiVerifyCodeData.verificationCode"
        :config="{
          placeholder: '請輸入驗證碼',
          length: 6,
          serverTime: serverTime?.full,
          expires: countdownData.expires,
          autoCountdown: true,
          message: {
            timeout: '{timeout} 秒後重送',
            reSend: '重新發送',
          },
        }"
        :rules="{
          required: '請輸入驗證碼',
          minlength: '請輸入 { minlength } 位數驗證碼',
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
          button: '--h-35 --px-15',
        }"
        @submit="onSubmit"
      />
    </Form>
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
