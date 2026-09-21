<script setup>
const { onUseMeta } = useCommonActions()
const memberCenter = useMemberCenterStore()
const { message } = storeToRefs(memberCenter)
const { onApiGetMemberMessages } = useMemberCenterActions()
const { onApiErrorServerToClient } = usePopupActions()
const route = useRoute()

definePageMeta({
  layout: 'member',
  channel: 'member',
  // 由 middleware/auth.global.js 讀:登入狀態續不回來就導回登入頁
  requiresAuth: true,
})

// 分頁器是 router-link,頁碼跟著網址走 —— 重整與分享都會停在同一頁。
const onMemberMessages = async () => {
  message.value.apiData.page = Number(route.query.pg) || 1

  await onApiGetMemberMessages()
}

await onMemberMessages()

watch(() => route.query.pg, onMemberMessages)

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
      <PageMemberCenterHeader title="留言紀錄" />
      <PageMemberCenterMessageContent @deleted="onMemberMessages" />
    </CommonMContent>
  </CommonMContainer>
</template>
