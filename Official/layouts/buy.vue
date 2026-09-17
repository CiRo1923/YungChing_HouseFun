<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'

// buy 頻道色票的 hash URL(集中在 _channelColor 用 ?url 引用)。
const colorHref = getChannelColorHref('buy')

const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const { onGetAuthTokenCookie, onApiGetMemberAuthHandoffToken, onRestoreAuthToken } =
  useMemberAuthProjectActions()
const buyProject = useBuyProjectStore()
const { access } = storeToRefs(buyProject)
const {
  onPopupLogin,
  onApiPostBuyAuthTokenExchange,
  onApiGetBuyAuthMe,
  onApiPostBuyAuthLogout,
  onRestoreAccessData,
  onGetAccessDataCookie,
} = useBuyProjectActions()

const footerRef = ref(null)
const popupLoginContainerRef = ref(null)

const route = useRoute()
const nuxtApp = useNuxtApp()

// footer 元素 ref,提供給子孫元件(如 BuyMTop)動態計算避開 footer 的位置

provide('footerRef', footerRef)

// 掛載 buy 頻道色票(同步 composable 一律放在 await 之前)
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: colorHref,
    },
  ],
})

const onInit = async () => {
  // 啟動還原一次:從 cookie 取回 authToken 寫回 store(取代原本的 restore-auth-token plugin)。
  await onRestoreAuthToken()

  // 啟動還原一次:從 cookie 取回 accessData 寫回 store(取代原本的 restore-access-data plugin)。
  await onRestoreAccessData()

  if (access.value.data) {
    await onApiGetBuyAuthMe()
  }
}

// SSR 首屏就取得:callOnce 於 server 執行一次,userData 隨 Pinia payload 帶到 client,不重打。
// 放在 setup 最後,await 之後不再有同步 composable。
await callOnce(onInit)

// 每次換頁(含首次 immediate)重新檢查 accessData 時效。
// onGetAccessDataCookie 只驗 accessData;authToken 是否走 SSO 在這裡分開判斷。
const onAccessCheck = async () => {
  // accessData 仍有效 → 不用做事

  if (await onGetAccessDataCookie()) return

  // accessData 過期 / 未登入 → 再看 authToken(30 天)
  const authToken = await onGetAuthTokenCookie()

  if (authToken) {
    // authToken 仍有效 → 打另一支 SSO API 重新換發 accessData
    await onApiGetMemberAuthHandoffToken('buy')
    await onApiPostBuyAuthTokenExchange()
    await onApiGetBuyAuthMe()
  }
}

// immediate + callback 內含 await → 用 runWithContext 保住 Nuxt instance,
// 否則 await 之後呼叫 useCookie / $fetch 會噴「composable called outside setup」。
watch(
  () => route.fullPath,
  () => nuxtApp.runWithContext(onAccessCheck),
  {
    // 只在 client 觸發:server 沒有換頁、首次檢查也留給 client,避免 SSR 就打 API。
    immediate: import.meta.client,
  }
)
</script>

<template>
  <div class="l-wrap">
    <CommonHeader>
      <CommonMLogStatus @login="onPopupLogin" @logout="onApiPostBuyAuthLogout" />
    </CommonHeader>
    <main class="l-body relative z-0">
      <slot />
    </main>
    <footer class="l-footer" ref="footerRef">
      <CommonMFooter
        :setClass="{
          main: 'bg-[--white]',
        }"
      />
    </footer>
    <CommonMLoading
      :config="{
        isFixed: true,
      }"
      v-if="isLoading"
    />
  </div>
  <div id="box">
    <CommonAlertSystem />
    <CommonConfirmSystem />
    <CommonLoginSystem :container="popupLoginContainerRef">
      <!-- 預留之後有不一樣的 login -->
      <LoginContainer ref="popupLoginContainerRef" />
      <template #note>
        <LoginNote />
      </template>
    </CommonLoginSystem>
    <CommonApiPromiseSystem />
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--gray-feea];
}
</style>
