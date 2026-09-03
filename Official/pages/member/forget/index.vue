<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
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

// TODO: 待忘記密碼「發送驗證碼」API 就緒後接上
// (呼叫發送 API → 取得 expires → 傳入 VerifyCountdown 的 config.expires 觸發倒數)。
const onSendCode = () => {}

// TODO: 待「驗證手機 + 驗證碼」API 就緒後接上(成功才換頁,並把 token 交給下一步)。
const onSumit = () => {
  router.push({
    name: 'member-forget-reset',
  })
}
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
