<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  // TODO: 未完成重設就直接進來要退回第一步(比照 upgrade/complete 的 middleware),
  // 等 API 確定用什麼 token(cookie 名稱與效期)再補。
})

await onWithLoadingAll([])

onUseMeta({
  title: '密碼設定完成 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberForgetHeader
      title="密碼設定完成"
      :config="{
        step: 3,
      }"
    />
    <PageMemberForgetCompleteContent />
  </CommonMContainer>
</template>
