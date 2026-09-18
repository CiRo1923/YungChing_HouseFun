<script setup>
const { onUseMeta } = useCommonActions()
const { onCustom, onApiErrorServerToClient } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  // 登入機制還沒接上,目前沒有任何地方讀這個值 —— 接上之後由路由守衛依它決定要不要擋
  requiresAuth: true,
})

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 密碼改掉之後後端就要求重新登入,所以彈窗沒有 X、只有一顆「登入」——
// 唯一的出口就是去登入頁。登入狀態由登入頁自己清(見 pages/member/login/index.vue)。
const onComplete = async () => {
  await onCustom({
    id: 'popupMemberCenterPasswordComplete',
    title: '成功更新密碼',
    hasExistClose: false,
    btns: [
      {
        id: 'sure',
        label: '登入',
        class: '--bg-orange-f74c --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })

  router.push({
    name: 'member-login',
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
      <PageMemberCenterHeader title="密碼管理" />
      <PageMemberCenterPasswordContent @complete="onComplete" />
    </CommonMContent>
  </CommonMContainer>
  <PageMemberCenterPasswordPopupComplete />
</template>
