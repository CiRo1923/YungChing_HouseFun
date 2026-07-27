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
    class="p:--max-w-400 space-y-[40px] tm:pt-[20px] p:pt-[55px]"
    :config="{
      as: 'section',
    }"
  >
    <b class="block text-center font-medium tm:text-[24px] p:text-[30px]">完成註冊</b>
    <CommonImgSrc
      src="member/register/complete/icon_complete.svg"
      :setClass="{
        main: 'mx-auto h-[170px] w-[160px]',
      }"
    />
    <div class="space-y-[10px] text-[16px]">
      <p>歡迎您成為好房網的會員，請妥善保管您的會員帳號及密碼請勿將帳號資料提供給他人知道。</p>
      <p>現在您可以使用好房網的提供的各項找房服務。</p>
    </div>
    <CommonMAnchor
      text="立即登入"
      :setClass="{
        main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 w-full',
        text: 'text-[16px]',
      }"
    />
  </CommonMContainer>
</template>

<style lang="postcss"></style>
