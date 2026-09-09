<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'

// member 頻道色票的 hash URL(集中在 _channelColor 用 ?url 引用)。
const colorHref = getChannelColorHref('member')

const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const { onRestoreAuthToken } = useMemberAuthProjectActions()
const memberAuthProject = useMemberAuthProjectStore()
const { userData } = storeToRefs(memberAuthProject)
const memberCenter = useMemberCenterStore()
const { access } = storeToRefs(memberCenter)
const { onApiAuthMe, onApiAuthLogout, onRestoreAccessData } = useMemberProjectActions()

// 掛載 member 頻道色票(同步 composable 一律放在 await 之前)
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: colorHref,
    },
  ],
})

const onInit = async () => {
  // 啟動還原一次:從 cookie 取回 authToken 與這個服務的 accessData 寫回 store。
  await onRestoreAuthToken()
  await onRestoreAccessData()

  // userData 已經有值就不重打:登入頁換完 token 後自己取過一次
  // (pages/member/login/index.vue),導頁進來會再走一次 onInit,
  // 沒有這道閘 me 會被打兩次 —— 失敗時連跳兩個錯誤 alert。
  if (access.value.data && !userData.value) {
    await onApiAuthMe()
  }
}

// SSR 首屏就取得:callOnce 於 server 執行一次,userData 隨 Pinia payload 帶到 client,不重打。
// 放在 setup 最後,await 之後不再有同步 composable。
await callOnce(onInit)
</script>

<template>
  <div class="l-wrap">
    <CommonHeader>
      <CommonMLogStatus
        :config="{
          login: 'account',
          logout: 'login',
        }"
        @logout="onApiAuthLogout"
      />
    </CommonHeader>
    <!-- <CommonHeader>
      <CommonMAnchor
        text="回首頁"
        :config="{
          icon: {
            name: 'chevron_left',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--oval --border-gray-ccce --h-35 --px-10 gap-x-[5px] text-[--gray-666]',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px] p-[2px] text-[--gray-999]',
        }"
      /> 
    </CommonHeader>
    -->
    <!-- <CommonHeader @login="onPopupLogin" @logout="onApiAuthLogout" /> -->
    <main class="l-body relative z-0 tm:mt-[20px] p:mt-[30px]">
      <slot />
    </main>
    <footer class="l-footer">
      <CommonMFooter
        :setClass="{
          main: 'bg-[--white]',
        }"
      />
    </footer>
    <CommonMLoadingMain
      :config="{
        isFixed: true,
      }"
      v-if="isLoading"
    />
  </div>
  <div id="box">
    <CommonAlertSystem />
    <CommonConfirmSystem />
    <CommonApiPromiseSystem />
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--gray-ef];
}
</style>
