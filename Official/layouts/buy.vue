<script setup>
import { getChannelColorHref } from '@js/runtime/channelColor.js'
import { apiBuyHouse } from '@js/_api/buy/house.js'

// buy 頻道色票的 hash URL(集中在 _channelColor 用 ?url 引用)。
const colorHref = getChannelColorHref('buy')

const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const { onGetAuthTokenCookie, onApiAuthHandoffToken, onRestoreAuthToken } =
  useMemberProjectActions()
const buyProject = useBuyProjectStore()
const { access } = storeToRefs(buyProject)
const {
  onPopupLogin,
  onApiAuthTokenExchange,
  onApiAuthMe,
  onApiAuthLogout,
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
    await onApiAuthMe()
  }
}

// SSR 首屏就取得:callOnce 於 server 執行一次,userData 隨 Pinia payload 帶到 client,不重打。
// 放在 setup 最後,await 之後不再有同步 composable。
await callOnce(onInit)

// SSR 預抓 SEO:layout(含 Header)的渲染早於頁面 <slot>,若不在此先備好 project.seo,
// Header 的資料型 H1 在 SSR 會是空的。只在 server 跑(client 由各頁 onApiBuyXxx 反應式更新);
// 為 best-effort,失敗不得中斷渲染。
if (import.meta.server) {
  const { onSetSeo } = useCommonActions()

  try {
    if (route.name === 'buy-house-hfid') {
      const { status, data } = await apiBuyHouse({ hfid: route.params.hfid })

      if (status === 200) onSetSeo(data.seo)
    } else if (route.name === 'buy-list-filters') {
      const { onChannel, onGetBuyListParams, onApiBuyList } = useBuyListActions()

      onChannel()
      onGetBuyListParams()
      await onApiBuyList()
    }
  } catch {
    // 靜默:SEO 預抓失敗不影響頁面渲染
  }
}

// 每次換頁(含首次 immediate)重新檢查 accessData 時效。
// onGetAccessDataCookie 只驗 accessData;authToken 是否走 SSO 在這裡分開判斷。
const onAccessCheck = async () => {
  // accessData 仍有效 → 不用做事

  if (await onGetAccessDataCookie()) return

  // accessData 過期 / 未登入 → 再看 authToken(30 天)
  const authToken = await onGetAuthTokenCookie()

  if (authToken) {
    // authToken 仍有效 → 打另一支 SSO API 重新換發 accessData
    await onApiAuthHandoffToken('buy')
    await onApiAuthTokenExchange()
    await onApiAuthMe()
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
    <CommonHeader @login="onPopupLogin" @logout="onApiAuthLogout" />
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
    <CommonLoginSyetem :container="popupLoginContainerRef">
      <!-- 預留之後有不一樣的 login -->
      <LoginContainer ref="popupLoginContainerRef" />
      <template #note>
        <LoginNote />
      </template>
    </CommonLoginSyetem>
    <CommonApiPromiseSystem />
    <!-- <ApiRunSystem /> -->
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--gray-feea];
}
</style>
