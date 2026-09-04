<script setup>
import { FORGETRESET } from '@js/_storage.js'
import { deCrypto } from '@js/.crypto/index.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberForget = useMemberForgetStore()
const { verify } = storeToRefs(memberForget)
const { onGetCookie, onApiAuthPasswordResetConfirm, reset } = useMemberForgetActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
  middleware: [
    () => {
      const raw = useCookie(FORGETRESET).value
      const data = raw ? deCrypto(raw) : null

      // 沒有 resetToken(未經手機驗證進來、或已過 expireAt 被瀏覽器清掉)→
      // confirm 打不了,退回第一步重跑。
      //
      // ⚠️ verificationCode 也要檢查:它是離開步驟 1 前才補寫進同一支 cookie 的
      // (見 onSaveVerify)。「發完碼就重整」的情況下 cookie 已經有 resetToken 但
      // verificationCode 還是 null —— 那時手打本頁網址進得來,卻只會送出必然失敗的
      // confirm。缺值就退回,不要讓人卡在死路上。
      //
      // middleware 只判斷「有沒有有效值」,用 useCookie + deCrypto 就夠,
      // 不必為此初始化整個 store(server 端 store 也沒有值)。
      if (!data?.resetToken || !data?.verificationCode) {
        return navigateTo(
          {
            name: 'member-forget',
          },
          {
            replace: true,
          }
        )
      }
    },
  ],
})

await onWithLoadingAll([])

onUseMeta({
  title: '忘記密碼 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

// 驗證碼與新密碼一起送出(這條流程只有 confirm 會驗證碼)。
// 驗證碼錯誤時 action 會導回步驟 1,所以這裡只處理成功的去向。
const onSumit = async () => {
  onApiPromise('open')

  const { status } = await onApiAuthPasswordResetConfirm()

  onApiPromise('close')

  if (status !== 200) return

  router.push({
    name: 'member-forget-complete',
  })
}

// 手機號碼、驗證碼與 resetToken 都在步驟 1 寫進 cookie;本頁 URL 不帶,
// 重整後靠 cookie 還原,confirm 才有東西可送。走到這裡代表 middleware 已放行。
const onInit = () => {
  reset.onResetPassword()

  const { mobilePhone, verificationCode, resetToken } = onGetCookie(FORGETRESET) ?? {}

  verify.value.apiData.mobilePhone = mobilePhone ?? null
  verify.value.apiData.verificationCode = verificationCode ?? null
  verify.value.apiData.resetToken = resetToken ?? null
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
    <PageMemberForgetHeader
      title="忘記密碼"
      :config="{
        step: 2,
      }"
    />
    <PageMemberForgetResetContent @submit="onSumit" />
  </CommonMContainer>
</template>
