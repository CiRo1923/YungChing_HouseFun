<script setup>
const { onUseMeta } = useProjectActions()
const { onCustom, onApiErrorServerToClient } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  // 由 middleware/auth.global.js 讀:登入狀態續不回來就導回登入頁
  requiresAuth: true,
})
// api 目前回不到資料,取回來會把假資料蓋掉,所以初次載入先不取 ——
// 畫面吃 stores/member/center.js 的 account.data。api 有資料之後這裡要加回
// 下面兩行(上面那一行的取出也要一起加回來),那一份假資料也改回 null:
//
//   const { onApiGetMemberProfile } = useMemberCenterActions()
//   await callOnce('member-account', onApiGetMemberProfile, { mode: 'navigation' })
//
// 包 callOnce 的原因:頁面的 setup 在 SSR 跑一次、hydration 在瀏覽器再跑一次,
// 直接 await 的話同一支 api 會發兩次。mode 要 navigation,預設的 render 模式記號永遠留著,
// 換去別頁再回來會跳過,那一頁就停在離開前的資料。

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
