<script setup>
import { FORGETRESET } from '@js/_storage.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberForget = useMemberForgetStore()
const { verify } = storeToRefs(memberForget)
const { onGetCookie, onApiAuthPasswordResetRequest, onSaveVerify, reset } = useMemberForgetActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

await onWithLoadingAll([])

onUseMeta({
  title: '忘記密碼 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 發送(或重送)驗證碼。管道目前一律 sms —— swagger 把它寫成 integer 0 / 1 是轉譯錯誤,
// 實際要帶字串;未來可能改發 LINE,值集中在 store 的 verificationChannels。
const onSendCode = async () => {
  onApiPromise('open')

  await onApiAuthPasswordResetRequest(memberForget.verificationChannels.sms)

  onApiPromise('close')
}

// 驗證碼要到步驟 2 的 confirm 才驗得到 → 這裡沒有 API 可打,格式與「已發過碼」由
// Content 檢查完才會走到這裡。換頁前把驗證碼補寫進 cookie(步驟 2 重整時 store 會清空)。
const onSumit = () => {
  onSaveVerify()

  router.push({
    name: 'member-forget-reset',
  })
}

// resetToken 由發送驗證碼寫進 cookie;本頁 URL 不帶這些值,重整後靠 cookie 還原,
// 倒數與「下一步」才知道這一輪已經發過碼。未發過或已過期(瀏覽器自動清掉)時為 null。
const onInit = () => {
  reset.onVerify()

  const { mobilePhone, verificationCode, resetToken, expireAt } = onGetCookie(FORGETRESET) ?? {}

  verify.value.apiData.mobilePhone = mobilePhone ?? null
  verify.value.apiData.verificationCode = verificationCode ?? null
  verify.value.apiData.resetToken = resetToken ?? null
  verify.value.countdownData.expires = expireAt ?? null
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
    <PageMemberForgetHeader
      title="忘記密碼"
      :config="{
        step: 1,
      }"
    />
    <PageMemberForgetIndexContent @sendCode="onSendCode" @submit="onSumit" />
  </CommonMContainer>
</template>
