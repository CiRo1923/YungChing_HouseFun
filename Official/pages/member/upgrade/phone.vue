<script setup>
import { EMAILVERIFYTOKEN } from '@js/_storage.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { phone } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onApiAuthEmailUpgradeMobileCheck,
  onApiAuthEmailUpgradeMobileVerificationCode,
  reset,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(EMAILVERIFYTOKEN).value

      // 沒有 upgradeToken(未經 email 驗證進來、或已過 expiresAt 被瀏覽器清掉)→
      // mobile API 都缺 header X-Upgrade-Token,打不了,退回 email 那步重跑
      if (!raw || !deCryptoJSON(raw)) {
        return navigateTo(
          {
            name: 'member-upgrade-email',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

// details 只取第一筆(後端第一筆即為要呈現的原因),後面的忽略
const exceededMessage = computed(() => {
  const { details, message } = phone.value.apiResult ?? {}

  return [details?.[0], message].filter(Boolean).join('<br />')
})

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 檢查號碼 → 需要合併帳號才發送驗證碼。兩支是同一個動作的兩段,
// loading 一路包到底,中間不閃一次關閉再開啟。
const onSumit = async () => {
  onApiPromise('open')

  const { status, data } = await onApiAuthEmailUpgradeMobileCheck()

  // requiresMerge 為 false 代表這支號碼不需要合併,沒有後續驗證碼流程
  if (status !== 200 || data?.requiresMerge !== true) {
    onApiPromise('close')
    return
  }

  const { status: verificationCodeStatus } = await onApiAuthEmailUpgradeMobileVerificationCode()

  onApiPromise('close')

  if (verificationCodeStatus === 200) {
    router.push({
      name: 'member-upgrade-phone-verify',
    })
  }
}

// upgradeToken 由上一頁(email 驗證成功)寫進 cookie;本頁 URL 不帶這個值,
// 改由 cookie 取回還原到 store,mobile/check 才有 header X-Upgrade-Token 可帶。
// cookie SSR 讀得到 → 重整後仍在;未經上一頁進來或已失效時為 null。
//
// 當日發送次數已達上限(429)時會寫 EXCEEDED cookie(效期到今天 23:59:59),
// 一進頁面就取回還原到 apiResult,重整 / 換頁 / 返回都能保持「已超限」的呈現。
// 未超限或已跨日(瀏覽器自動清掉 cookie)時為 null。
const onInit = () => {
  reset.onPhone()

  phone.value.token = onGetCookie(EMAILVERIFYTOKEN)
  // phone.value.apiResult = onGetCookie(EXCEEDED)
}

onInit()
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <template v-if="!phone.apiResult">
      <PageMemberUpgradeHeader
        title="帳號升級"
        :config="{
          description: '新版好房網改以手機號碼登入<br />請驗證您的手機完成升級',
        }"
        :setClass="{
          main: 'text-center',
        }"
      />
      <PageMemberUpgradePhoneContent @submit="onSumit" />
    </template>
    <PageMemberUpgradeExceeded :message="exceededMessage" v-if="phone.apiResult" />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
