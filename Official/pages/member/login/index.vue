<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiAuthToken } = useMemberProjectActions()
const { onApiPromise } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

const loginContainerRef = ref(null)

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 帳密登入 → 成功即建立登入狀態(authToken + AUTHTOKEN cookie 由 store action 寫好)。
// channel 是「發起登入的頻道」,比照既有登入流程的 `${頻道}-web`。
//
// TODO: 登入成功後的去向待確認(member 頻道目前沒有登入後的落腳頁)。
const onAuthToken = async () => {
  const { valid } = (await loginContainerRef.value?.form?.validate?.()) ?? {}

  if (!valid) return

  onApiPromise('open')

  const { status } = await onApiAuthToken({
    channel: 'member-web',
  })

  onApiPromise('close')

  if (status !== 200) return
}

// 驗證碼登入。
// 先驗證再說 —— API 還沒接,但少了這段,使用者在這個 tab 按登入會完全沒有反應
// (密碼 tab 與 popup 登入都會驗,只有這條路徑不驗,行為不一致)。
//
// TODO: 待 member 驗證碼「發送 / 驗證」API 就緒後接上(containers/login/VerifyCode.vue 同一組 TODO)。
const onAuthVerifyCode = async () => {
  const { valid } = (await loginContainerRef.value?.form?.validate?.()) ?? {}

  if (!valid) return
}

// 兩個 tab 的送出資料不同(帳密走 login.auth、驗證碼走 login.verify),
// 所以要先問 Container 現在停在哪個 tab 再決定打哪一支。
const onLogin = async () => {
  if (loginContainerRef.value?.activeId === 'verifyCode') {
    await onAuthVerifyCode()

    return
  }

  await onAuthToken()
}
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberLoginHeader
      title="會員登入"
      :setClass="{
        main: 'text-center',
      }"
    />
    <LoginContainer ref="loginContainerRef" />
    <PageMemberLoginIndexActionButton @login="onLogin" />
    <LoginNote />
  </CommonMContainer>
</template>
