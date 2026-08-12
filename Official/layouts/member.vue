<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'

// member 頻道色票的 hash URL(集中在 _channelColor 用 ?url 引用)。
const colorHref = getChannelColorHref('member')

const common = useCommonStore()
const { isLoading } = storeToRefs(common)
// const memberProject = useMemberProjectStore()
// const { accessData } = storeToRefs(memberProject)
// const { onPopupLogin, onApiAuthMe, onApiAuthLogout } = useBuyProjectActions()
// const popupLoginContainerRef = ref(null)

// 掛載 buy 頻道色票(同步 composable 一律放在 await 之前)
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: colorHref,
    },
  ],
})

// const onInit = async () => {
//   if (accessData.value) {
//     await onApiAuthMe()
//   }
// }

// SSR 首屏就取得:callOnce 於 server 執行一次,userData 隨 Pinia payload 帶到 client,不重打。
// 放在 setup 最後,await 之後不再有同步 composable。
// await callOnce(onInit)
</script>

<template>
  <div class="l-wrap">
    <CommonHeader>
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
    <!-- <CommonHeader @login="onPopupLogin" @logout="onApiAuthLogout" /> -->
    <main class="l-body relative z-0">
      <slot />
    </main>
    <footer class="l-footer">
      <CommonMFooter
        :setClass="{
          main: 'border-t-[1px] border-t-[--gray-e5]',
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
  @apply bg-[--white];
}
</style>
