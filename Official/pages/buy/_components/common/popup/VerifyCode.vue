<script setup>
import { countdown } from '@js/_prototype.js'
import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { serverTime, apiVerifyCodeData, countdownData } = storeToRefs(buyProject)
const {
  onApiMessagesVerifyCode,
  onApiMessagesResendCode,
  onPopupCottonCandy,
  onPopupMessageSucess,
} = useBuyProjectActions()
const popup = usePopupStore()
const { customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()
const { onPromise } = usePopupActions()

const formRef = ref(null)

const onReSend = async () => {
  // 期間以 BuyMPopupPromise 遮罩擋住操作（疊在驗證 popup 內，取代自管的防連點旗標）
  // 成功後 action 會更新 countdownData.expires → 觸發 watch → 自動重新倒數
  onPromise('open')
  await onApiMessagesResendCode()
  onPromise('close')
}

// 用指定的到期時間開始倒數（onStart 內部會先 onStop 舊的，等於覆蓋重來）
const onTimeout = (expires) => {
  if (!expires) return

  // startTime 帶 serverTime.full（serverTime 是物件，full 才是完整日期時間字串）
  // 沒值時留 undefined，onStart 會 fallback 成 Date.now()
  countdown.onStart({
    startTime: serverTime.value?.full,
    expireTime: expires,
    format: 'sss',
    onTick: ({ remainingSec }) => {
      countdownData.value.timeout = remainingSec
    },
    onDone: () => {
      countdownData.value.timeout = 0
    },
  })
}

const onSure = async () => {
  const validate = async () => await formRef.value?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才真正 resolve + close
  customCheck.value(true)
  // onCustomClose()
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

// 送出 / 重送拿到新的到期時間 → 用新的重新倒數（覆蓋舊的）
watch(
  () => countdownData.value.expires,
  (expires) => onTimeout(expires)
)

// 掛載時若 expires 已備妥（前一個 popup 送出後設定）就起算
onMounted(() => {
  if (countdownData.value.expires) onTimeout(countdownData.value.expires)
})
</script>

<template>
  <BuyCommonCustomPopup
    id="popupVerifyCode"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600',
    }"
    @sure="onSure"
  >
    <p class="mb-[15px] text-[20px] font-medium">請輸入您收到的 6 位數驗證碼</p>
    <Form as="div" ref="formRef">
      <BuyMFormInput
        name="verificationCode"
        v-model="apiVerifyCodeData.verificationCode"
        :config="{
          placeholder: '請輸入驗證碼',
          length: 6,
          integer: true,
          inputChinese: false,
        }"
        :rules="{
          required: '請輸入驗證碼',
          minlength: '請輸入 { minlength } 位數驗證碼',
        }"
        :setClass="{
          main: '--rounded --px-12 --py-8 --h-55',
        }"
      >
        <template #rearAssist>
          <BuyMAnchor
            :text="`${countdownData.timeout} 秒後重送`"
            :setClass="{
              main: '--h-35 --oval --bg-green-8b0d66 --text-white --px-15',
              text: 'text-[14px]',
            }"
            v-if="countdownData.timeout !== 0"
          />
          <BuyMAnchor
            text="重新發送"
            :setClass="{
              main: '--h-35 --oval --bg-green-8b0d66 --text-white --px-15',
              text: 'text-[14px]',
            }"
            @click="onReSend"
            v-else
          />
        </template>
      </BuyMFormInput>
    </Form>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
