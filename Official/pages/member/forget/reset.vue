<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  // TODO: 未經手機驗證直接進來要退回第一步(比照 upgrade/phone 的 middleware),
  // 等 API 確定用什麼 token(cookie 名稱與效期)再補。
})

await onWithLoadingAll([])

onUseMeta({
  title: '忘記密碼 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// TODO: 待「重設密碼」API 就緒後接上(成功才換頁)。
const onSumit = () => {
  router.push({
    name: 'member-forget-complete',
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
        step: 2,
      }"
    />
    <PageMemberForgetResetContent @submit="onSumit" />
  </CommonMContainer>
</template>
