<script setup>
import { EMAILVALUE, EMAILVERIFY, EMAILEXCEEDED } from '@js/_storage.js'
import { onMaskEmail } from '@js/_projectPrototype.js'
import { deCryptoJSON } from '@js/_crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { email, emailVerify } = storeToRefs(memberUpgrade)
const {
  onGetCookie,
  onApiAuthEmailUpgradeVerificationCode,
  onApiAuthEmailUpgradeVerificationCodeVerify,
  onPopupCustomer,
  reset,
} = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const exceededRaw = useCookie(EMAILEXCEEDED).value
      const verifyRaw = useCookie(EMAILVERIFY).value

      // 有超限紀錄 → 不進本頁,退回上一頁自行呈現。
      // 沒有 challengeToken(未經上一頁進來、或倒數結束後被瀏覽器清掉)也一樣退回:
      // 本頁的驗證與重送都需要它,留在這裡只會送出空值吃 400。
      if ((exceededRaw && deCryptoJSON(exceededRaw)) || !verifyRaw || !deCryptoJSON(verifyRaw)) {
        return navigateTo(
          {
            name: 'member-upgrade-email',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

const apiData = computed(() => emailVerify.value.apiData)
// 只用於顯示;要打 API 時請用未遮蔽的 apiData.email
const maskEmail = computed(() => onMaskEmail(email.value.apiData.email))

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 重新寄送 email 驗證碼
const onAuthEmailUpgradeVerificationCode = async () => {
  onApiPromise('open')

  const { status } = await onApiAuthEmailUpgradeVerificationCode()

  onApiPromise('close')

  // 已達寄送上限 → 退回上一頁呈現(EMAILEXCEEDED cookie 已由 API 處理寫好)
  if (status !== 429) return

  await navigateTo(
    {
      name: 'member-upgrade-email',
    },
    {
      replace: true,
    }
  )
}

// 驗證 email 驗證碼 → 通過才進手機那步。
// canDefer 為 false 代表這個帳號不能延後升級 → 不往下走,改請使用者聯繫客服。
const onAuthEmailUpgradeVerificationCodeVerify = async () => {
  onApiPromise('open')

  const { status, data } = await onApiAuthEmailUpgradeVerificationCodeVerify()

  onApiPromise('close')

  if (status !== 200) return

  if (data?.canDefer !== true) {
    await onPopupCustomer()

    return
  }

  router.push({
    name: 'member-upgrade-phone',
  })
}

const onReSend = async () => {
  await onAuthEmailUpgradeVerificationCode()
}

const onSumit = async () => {
  await onAuthEmailUpgradeVerificationCodeVerify()
}

// email 與 challengeToken 都由上一頁寫進 cookie;本頁 URL 不帶這兩個值,
// 改由 cookie 取回還原到 store。cookie SSR 讀得到 → 重整後仍在。
// email 是 session cookie;EMAILVERIFY 的效期跟隨 resendAvailableAt,過期後瀏覽器自動清掉。
// 未經上一頁進來或 cookie 已失效時為 null。
const onInit = () => {
  reset.onEmailVerify()

  // 命名為 ...Cookie 以免遮蔽 store 的 emailVerify
  const emailVerifyCookie = onGetCookie(EMAILVERIFY)

  email.value.apiData.email = onGetCookie(EMAILVALUE)
  apiData.value.challengeToken = emailVerifyCookie?.challengeToken ?? null

  // 倒數的到期時間也一起還原,倒數元件才能在 SSR(首屏)就算出剩餘秒數
  emailVerify.value.countdownData.expires = emailVerifyCookie?.resendAvailableAt ?? null
}

onInit()
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 space-y-[30px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberUpgradeHeader
      title="輸入驗證碼"
      :setClass="{
        main: 'text-center',
      }"
    >
      <template #description>驗證碼已發送至 {{ maskEmail }}</template>
    </PageMemberUpgradeHeader>
    <PageMemberUpgradeEmailVerifyContent @reSend="onReSend" @submit="onSumit" />
  </CommonMContainer>
  <PageMemberUpgradePopupCustomer />
</template>

<style lang="postcss"></style>
