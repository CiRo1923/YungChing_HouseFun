<script setup>
const { onUseMeta, onWithLoadingAll } = useCommonActions()

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
</script>

<template>
  <CommonMContainer
    class="p:--max-w-500 tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <PageMemberRegisterHeader
      title="會員註冊"
      :config="{
        description: '請選擇註冊身份',
      }"
      :setClass="{
        container: 'grow text-center',
      }"
    />
    <PageMemberRegisterIndexLinks />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
