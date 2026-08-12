<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiAuthEmailUpgradeVerificationCode, reset } = useMemberUpgradeActions()
const { onApiPromise } = usePopupActions()
const router = useRouter()

definePageMeta({
  layout: 'member',
  channel: 'member',
  requiresAuth: false,
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

const onInit = () => {
  reset.onIndex()
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
      title="MAIL 會員升級"
      :config="{
        description: '進行 MAIL 驗證<br />將引導您升級為手機帳號，僅需 1 分鐘',
      }"
      :setClass="{
        main: 'text-center',
      }"
    />
    <PageMemberUpgradeIndexContent @submit="onSumit" />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
