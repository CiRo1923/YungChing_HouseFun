<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiAuthToken, onReset: onMemberAuthReset } = useMemberAuthProjectActions()
const { onApiAuthTokenExchange, onApiAuthMe, onClearCookies, onReset } = useMemberProjectActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member-auth',
  channel: 'memberAuth',
  requiresAuth: false,
})

const loginContainerRef = ref(null)

// 進到登入頁一律先把登入狀態清乾淨 —— store 與 cookie 都要,與登出同一組動作
// (見 stores/member/.composables/useProjectActions.js 的 onApiAuthLogout)。
// 帶著舊的 authToken / accessData 重新登入,換 token 那一步會吃到過期的憑證。
onMemberAuthReset()
onReset()
onClearCookies()

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
// 登入拿到的是 SSO 長 token,會員中心的 API 不吃它 → 用它換這個服務自己的 bearer token,
// 再取會員資料,然後進通知總覽。與 buy 頻道同一套順序(見 stores/buy 的 onPopupLogin):
// exchange 吃的就是 member/auth/token 回的 longToken。
//
// 三支一路包在同一個 loading 裡,中間不閃。換 token 沒過就留在原頁 ——
// 會員中心的每一支 API 都要帶那個 bearer token,沒有它進去也取不到資料。
const onAuthToken = async () => {
  const { valid } = (await loginContainerRef.value?.form?.validate?.()) ?? {}

  if (!valid) return

  onApiPromise('open')

  const { status } = await onApiAuthToken({
    channel: 'member-web',
  })

  if (status !== 200) {
    onApiPromise('close')
    return
  }

  const { status: exchangeStatus } = await onApiAuthTokenExchange()
  const { status: meStatus } = exchangeStatus === 200 ? await onApiAuthMe() : {}

  onApiPromise('close')

  // me 沒過也留在原頁。導過去的話 layouts/member.vue 的 onInit 會因為 userData
  // 還是空的而再打一次 me,同一個錯誤就跳兩次窗。
  if (meStatus !== 200) return

  router.push({
    name: 'member-center-notice-price',
  })
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
    class="p:--max-w-400 space-y-[30px]"
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
