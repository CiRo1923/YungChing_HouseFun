<script setup>
import { Form } from 'vee-validate'

const memberUpgrade = useMemberUpgradeStore()
const { emailVerify } = storeToRefs(memberUpgrade)

const emits = defineEmits(['reSend', 'submit'])
const continuousRef = ref(null)
const apiData = computed(() => emailVerify.value.apiData)
const apiResult = computed(() => emailVerify.value.apiResult)
// 兩個獨立維度:驗證碼是否過期、錯誤次數是否用完
const isExpired = computed(() => !apiData.value.challengeToken)
const isExceeded = computed(() => apiResult.value?.remainingAttempts === 0)

// 由上面兩維組出三種互斥狀態。互斥交給 template 的 v-if / v-else-if 串接保證,
// 各條件不必自行維護「排除清單」(排除清單一漏改就會兩塊提示同時冒出來)。
const isExpiredOnly = computed(() => isExpired.value && !isExceeded.value)
const isExceededOnly = computed(() => !isExpired.value && isExceeded.value)
const isExpiredExceeded = computed(() => isExpired.value && isExceeded.value)

const onReSend = () => {
  // 重新發送會拿到新的驗證碼,已輸入的舊碼一定不對 → 直接清掉。
  // 欄位設了 validateOnModelUpdate: false,清值不會觸發驗證,不必再清一次錯誤;
  // 送出時的主動 validate() 照常運作。
  apiData.value.verificationCode = null

  emits('reSend')
}

const onSumit = async (validate, setFieldError) => {
  const { verificationCode } = apiData.value
  const { name, config } = continuousRef.value
  const length = config.length

  const { valid } = await validate()

  if (!valid) return

  if (String(verificationCode ?? '').length < length) {
    setFieldError(name, `請輸入 ${length} 位數驗證碼`)
    return
  } else if (isExpired.value) {
    setFieldError(name, `驗證碼已失效請重新發送`)
    return
  } else if (isExceeded.value) {
    setFieldError(name, `錯誤達 ${apiResult.value.failedAttempts} 次請重新發送`)
    return
  }

  emits('submit')
}
</script>

<template>
  <Form as="div" class="space-y-[15px] text-center" v-slot="{ validate, setFieldError }">
    <PageMemberUpgradeExpired
      message="驗證碼已失效 (超過 1 分鐘有效時間並錯誤達 5 次)<br />請重新發送。"
      v-if="isExpiredExceeded"
    />
    <PageMemberUpgradeExpired
      message="驗證碼已失效 (超過 1 分鐘有效時間)<br />請重新發送。"
      v-else-if="isExpiredOnly"
    />
    <PageMemberUpgradeExpired
      message="驗證碼已失效 (錯誤達 5 次)<br />請重新發送。"
      v-else-if="isExceededOnly"
    />
    <CommonMFormContinuous
      name="verificationCode"
      v-model="apiData.verificationCode"
      :rules="{
        required: '請輸入驗證碼',
      }"
      :config="{
        validateEvents: ['blur', 'change'],
      }"
      :setClass="{
        main: 'mx-auto max-w-[302px]',
        container: 'gap-x-[10px]',
      }"
      ref="continuousRef"
    />
    <PageMemberUpgradeEmailVerifyCountdown @click="onReSend" />
    <CommonMAnchor
      text="確認"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
        text: 'text-[16px]',
      }"
      @click="onSumit(validate, setFieldError)"
    />
  </Form>
</template>
