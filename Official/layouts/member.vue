<script setup>
const common = useCommonStore()
const { isLoading } = storeToRefs(common)
const memberAuthProject = useMemberAuthProjectStore()
const memberCenter = useMemberCenterStore()
const { userData } = storeToRefs(memberAuthProject)
const { access } = storeToRefs(memberCenter)
const { onRestoreAuthToken } = useMemberAuthProjectActions()
const { onApiGetAuthMe, onApiPostAuthLogout, onRestoreAccessData } = useMemberProjectActions()

const onInit = async () => {
  // 啟動還原一次:從 cookie 取回 authToken 與這個服務的 accessData 寫回 store。
  await onRestoreAuthToken()
  await onRestoreAccessData()

  // 這個服務的會員資料已經有了就不重打:登入頁換完 token 後自己取過一次
  // (pages/member/login/index.vue),導頁進來會再走一次 onInit,
  // 沒有這道閘 me 會被打兩次 —— 失敗時連跳兩個錯誤 alert。
  //
  // 判準看 memberId 而不是 userData 本身:userData 是 buy 與會員中心共用的一份,
  // 而 memberId 只有 member BFF 的 auth/me 會給。從 buy 頻道進來時 userData 已經
  // 有值(buy 的形狀,沒有 memberId),用「有沒有值」當判準會把這支一起擋掉,
  // 帶不出 notifications 那幾支必填的 X-Member-Id。
  if (access.value.data && !userData.value?.memberId) {
    await onApiGetAuthMe()
  }
}

// SSR 首屏就取得:callOnce 於 server 執行一次,userData 隨 Pinia payload 帶到 client,不重打。
// 放在 setup 最後,await 之後不再有同步 composable。
await callOnce(onInit)
</script>

<template>
  <div class="l-wrap">
    <ProjectHeader>
      <CommonMLogStatus
        :config="{
          login: 'account',
          logout: 'login',
        }"
        @logout="onApiPostAuthLogout"
      />
    </ProjectHeader>
    <!-- <ProjectHeader>
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
    </ProjectHeader>
    -->
    <!-- <ProjectHeader @login="onPopupLogin" @logout="onApiPostAuthLogout" /> -->
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
    <CommonApiPromiseSystem />
  </div>
</template>

<style lang="postcss">
body {
  @apply bg-[--gray-ef];
}
</style>
