<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberForget = useMemberForgetStore()
const { onApiAuthPasswordResetRequest, onSaveVerify, reset } = useMemberForgetActions()
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

// 輸入頁不把自己的輸入值填回去 —— 發碼時寫的 cookie 是給步驟 2 用的。
//
// 還原號碼會有實際的坑:resetToken 綁定當初那支號碼,若把號碼填回輸入框、
// 使用者改填另一支,按「下一步」就會用舊 token 配新號碼送出,confirm 必然失敗。
// 所以這一頁重整後一律重新開始:重填號碼、重新發碼(60 秒冷卻由後端擋)。
const onInit = () => {
  reset.onVerify()
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
