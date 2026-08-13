<script setup>
import { Form } from 'vee-validate'

const memberUpgrade = useMemberUpgradeStore()
const { phoneVerify } = storeToRefs(memberUpgrade)

const emits = defineEmits(['reSend', 'submit'])
const continuousRef = ref(null)
const apiData = computed(() => phoneVerify.value.apiData)
const apiResult = computed(() => phoneVerify.value.apiResult)
// 兩個獨立維度:驗證碼是否過期、錯誤次數是否用完
const isExpired = computed(() => !apiData.value.verificationToken)
const isExceeded = computed(() => apiResult.value?.remainingAttempts === 0)

// 由上面兩維組出三種互斥狀態。互斥交給 template 的 v-if / v-else-if 串接保證,
// 各條件不必自行維護「排除清單」(排除清單一漏改就會兩塊提示同時冒出來)。
const isExpiredOnly = computed(() => isExpired.value && !isExceeded.value)
const isExceededOnly = computed(() => !isExpired.value && isExceeded.value)
const isExpiredExceeded = computed(() => isExpired.value && isExceeded.value)

const onReSend = async (validateField, setFieldError) => {
  const { name } = continuousRef.value

  // 重新發送會拿到新的驗證碼,已輸入的舊碼一定不對 → 直接清掉
  apiData.value.verificationCode = null

  // 清值會讓 required 立刻報錯(Field 綁 modelValue,值一變就重新驗證),而那次驗證是
  // 非同步的 —— 直接清錯誤會被它稍後回填的結果蓋回來(resetField 也一樣蓋不掉)。
  // vee-validate 只採用「最後發起」的那次驗證結果,故先自己補驗一次搶下最新,
  // 等它結束後再清錯誤,紅字才不會又冒出來。
  await nextTick()
  await validateField(name)

  setFieldError(name, undefined)

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
  <Form
    as="div"
    class="space-y-[15px] text-center"
    v-slot="{ validate, validateField, setFieldError }"
  >
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
      :setClass="{
        main: 'mx-auto max-w-[302px]',
        container: 'gap-x-[10px]',
      }"
      ref="continuousRef"
    />
    <PageMemberUpgradePhoneVerifyCountdown @click="onReSend(validateField, setFieldError)" />
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

<style lang="postcss"></style>
