<script setup>
const { onUseMeta } = useProjectActions()
const { onApiErrorServerToClient } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  // 由 middleware/auth.global.js 讀:登入狀態續不回來就導回登入頁
  requiresAuth: true,
})

// api 目前回不到資料,取回來會把假資料蓋掉,所以初次載入先不取 ——
// 分頁籤的未讀數吃 stores/member/center.js 的 noticeSummary.data。
// api 有資料之後這裡要加回下面三行,那一份假資料也改回 null:
//
//   const { onNoticeSummary, onApiGetMemberNotificationsPrice } = useMemberCenterActions()
//   await onNoticeSummary()
//   await onApiGetMemberNotificationsPrice()

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

onMounted(() => {
  onApiErrorServerToClient()
})
</script>

<template>
  <CommonMContainer class="p:--max-w-1430 p:--px-10 p:flex p:items-start p:gap-x-[25px]">
    <PageMemberCenterNavs />
    <CommonMContent
      class="p:--hasBgColor pt:--rounded-20 p:--py-25 t:--py-20 p:--px-40 m:--pb-20 tm:--px-16 grow t:mx-[10px]"
    >
      <PageMemberCenterHeader title="通知總覽" description="訊息保留 30 天，超過時限將會自動移除" />
      <PageMemberCenterNoticeTabs class="mt-[25px]" />
    </CommonMContent>
  </CommonMContainer>
</template>
