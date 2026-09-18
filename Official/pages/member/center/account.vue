<script setup>
const { onUseMeta } = useCommonActions()
const { onApiGetMemberProfile } = useMemberCenterActions()
const { onCustom, onApiErrorServerToClient } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  // 登入機制還沒接上,目前沒有任何地方讀這個值 —— 接上之後由路由守衛依它決定要不要擋
  requiresAuth: true,
})


await onApiGetMemberProfile()

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 改完留在原頁,所以彈窗只有一顆「確認」,按了就關掉。
const onComplete = async () => {
  await onCustom({
    id: 'popupMemberCenterAccountComplete',
    title: '會員資料更新成功',
    btns: [
      {
        id: 'sure',
        label: '確認',
        class: '--bg-orange-f74c --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })
}

onMounted(() => {
  onApiErrorServerToClient()
})
</script>

<template>
  <CommonMContainer class="p:--max-w-1430 p:--px-10 p:flex p:gap-x-[25px]">
    <PageMemberCenterNavs />
    <CommonMContent
      class="p:--hasBgColor pt:--rounded-20 p:--py-25 t:--py-20 p:--px-40 m:--pb-20 tm:--px-16 grow t:mx-[10px]"
    >
      <PageMemberCenterHeader title="帳號管理" />
      <PageMemberCenterAccountContent @complete="onComplete" />
    </CommonMContent>
  </CommonMContainer>
  <PageMemberCenterAccountPopupComplete />
</template>
