<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const memberUpgrade = useMemberUpgradeStore()
const { email } = storeToRefs(memberUpgrade)
const { onApiAuthEmailUpgradeVerificationCode, reset } = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
})

// details 只取第一筆(後端第一筆即為要呈現的原因),後面的忽略
const exceededMessage = computed(() => {
  const { details, message } = email.value.apiResult ?? {}

  return [details?.[0], message].filter(Boolean).join('<br />')
})

await onWithLoadingAll([])

onUseMeta({
  title: '會員中心 | 好房 HouseFun',
  description:
    '歡迎來到 好房會員中心 －上好房找好房 | 買租修繕加裝潢 | 提供您房屋買賣 | 好房快租 | 在地房地產新聞 | 仲介資訊 | 裝潢 | 修繕一站到位房產居家平台',
  url: useRequestURL(),
})

const onSumit = async () => {
  onApiPromise('open')
  const { status } = await onApiAuthEmailUpgradeVerificationCode()

  onApiPromise('close')

  if (status === 200) {
    router.push({
      name: 'member-upgrade-email-verify',
    })
  }
}

// 當日發送次數已達上限(429)時會寫 EXCEEDED cookie(效期到今天 23:59:59),
// 一進頁面就取回還原到 apiResult,重整 / 換頁 / 返回都能保持「已超限」的呈現。
// 未超限或已跨日(瀏覽器自動清掉 cookie)時為 null。
const onInit = () => {
  reset.onEmail()
  // email.value.apiResult = onGetCookie(EXCEEDED)
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
    <template v-if="!email.apiResult">
      <PageMemberUpgradeHeader
        title="MAIL 會員升級"
        :config="{
          description: '進行 MAIL 驗證<br />將引導您升級為手機帳號，僅需 1 分鐘',
        }"
        :setClass="{
          main: 'text-center',
        }"
      />
      <PageMemberUpgradeEmailContent @submit="onSumit" />
    </template>
    <PageMemberUpgradeExceeded :message="exceededMessage" v-if="email.apiResult" />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
