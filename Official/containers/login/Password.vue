<script setup>
const memberProjct = useMemberProjectStore()
const { login } = storeToRefs(memberProjct)
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
    </li>
  </ul>
</template>
<style lang="postcss"></style>
