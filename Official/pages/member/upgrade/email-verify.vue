<script setup>
import { EMAILVALUE, EMAILVERIFY } from '@js/_storage.js'
import { onMaskEmail } from '@js/_projectPrototype.js'

const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { index, upgrade } = storeToRefs(memberUpgrade)
const { onGetCookie, onApiAuthEmailUpgradeVerificationCode, reset } = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

const apiData = computed(() => upgrade.value.emailVerify.apiData)
// 只用於顯示;要打 API 時請用未遮蔽的 apiData.email
const maskEmail = computed(() => onMaskEmail(index.value.apiData.email))

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

const onReSend = async () => {
  onApiPromise('open')
  await onApiAuthEmailUpgradeVerificationCode()

  onApiPromise('close')
}

// email 與 challengeToken 都由上一頁寫進 cookie;本頁 URL 不帶這兩個值,
// 改由 cookie 取回還原到 store。cookie SSR 讀得到 → 重整後仍在。
// email 是 session cookie;challengeToken 的效期跟隨 resendAvailableAt,過期後瀏覽器自動清掉。
// 未經上一頁進來或 cookie 已失效時為 null。
const onInit = () => {
  reset.onEmailVerify()
  index.value.apiData.email = onGetCookie(EMAILVALUE)
  apiData.value.challengeToken = onGetCookie(EMAILVERIFY)
}

onInit()
</script>

<template>
  <CommonMContainer
    class="p:--max-w-400 tm:pt-[20px] p:pt-[55px]"
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
    <PageMemberUpgradeEmailVerifyContent @reSend="onReSend" />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
