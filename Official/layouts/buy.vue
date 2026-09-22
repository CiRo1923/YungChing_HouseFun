<script setup>
const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const { onAccessCheck } = useProjectActions()
const buyProject = useBuyProjectStore()
const { access } = storeToRefs(buyProject)
const { onRestoreAuthToken } = useMemberAuthProjectActions()
const { onPopupLogin, onApiGetBuyAuthMe, onApiPostBuyAuthLogout, onRestoreAccessData } =
  useBuyProjectActions()

const footerRef = ref(null)
const popupLoginContainerRef = ref(null)

const route = useRoute()
const nuxtApp = useNuxtApp()

// footer 元素 ref,提供給子孫元件(如 BuyMTop)動態計算避開 footer 的位置

provide('footerRef', footerRef)

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

// 每次換頁(含首次 immediate)重新檢查登入狀態的時效。
// buy 的頁面不需要登入也看得到,所以續不回來就維持未登入,不擋。
//
// immediate + callback 內含 await → 用 runWithContext 保住 Nuxt instance,
// 否則 await 之後呼叫 useCookie / $fetch 會噴「composable called outside setup」。
watch(
  () => route.fullPath,
  () => nuxtApp.runWithContext(() => onAccessCheck('buy')),
  {
    // 只在 client 觸發:server 沒有換頁、首次檢查也留給 client,避免 SSR 就打 API。
    immediate: import.meta.client,
  }
)
</script>

<template>
  <div class="l-wrap">
    <ProjectHeader>
      <CommonMLogStatus @login="onPopupLogin" @logout="onApiPostBuyAuthLogout" />
    </ProjectHeader>
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
    <ProjectLoginSystem :container="popupLoginContainerRef">
      <!-- 預留之後有不一樣的 login -->
      <LoginContainer ref="popupLoginContainerRef" />
      <template #note>
        <LoginNote />
      </template>
    </ProjectLoginSystem>
    <CommonApiPromiseSystem />
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--gray-feea];
}
</style>
