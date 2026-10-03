<script setup>
const memberProjct = useMemberAuthProjectStore()
const { login } = storeToRefs(memberProjct)
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const { onCustomClose } = usePopupActions()
const router = useRouter()

// 登入頁與登入 popup 共用這一支。在 popup 裡時先關掉 popup 再換頁 ——
// popup 掛在買屋的 layout 上,直接換頁的話它隨 layout 消失,
// 但開著的狀態與鎖住捲動的 body 樣式會留到忘記密碼那一頁。
const onForget = () => {
  if (customData.value.id === 'popupLoginSystem') onCustomClose()

  router.push({
    name: 'member-forget',
  })
}
</script>

<template>
  <ul class="space-y-[15px]">
    <li>
      <CommonMFormInput
        name="account"
        v-model="login.auth.apiData.account"
        :config="{
          placeholder: '請輸入帳號',
          // 不吃 modelUpdate:切換 tab 時 onReset 會清值,若清值即驗就會跳紅字
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '請輸入帳號',
        }"
        :setClass="{
          main: '--h-55 --px-12 --py-5 --border --rounded',
        }"
      />
    </li>
    <li>
      <CommonMFormPassword
        name="password"
        v-model="login.auth.apiData.password"
        :config="{
          placeholder: '請輸入 6 ~ 12 位密碼',
          // 不吃 modelUpdate:切換 tab 時 onReset 會清值,若清值即驗就會跳紅字
          validateEvents: ['blur', 'change'],
        }"
        :rules="{
          required: '請輸入密碼',
          custom: {
            valid: /^.{6,12}$/.test(login.auth.apiData.password),
            errorMessage: '請輸入 6 ~ 12 位密碼',
          },
        }"
        :setClass="{
          main: '--h-55 --px-12 --py-5 --border --rounded',
        }"
      />
      <div class="mt-[10px] text-right">
        <CommonMAnchor
          text="忘記密碼"
          :setClass="{
            main: 'text-[14px] underline',
          }"
          @click="onForget"
        />
      </div>
    </li>
  </ul>
</template>
