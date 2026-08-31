<script setup>
const memberProjct = useMemberProjectStore()
const { login } = storeToRefs(memberProjct)

// TODO: 待 member 驗證碼「發送 / 重送」API 就緒後接上
// （呼叫發送 API → 取得 expires → 傳入 config.expires 觸發元件倒數）
const onSubmit = () => {}
</script>

<template>
  <ul class="space-y-[15px]">
    <li>
      <CommonMFormInput
        name="phone"
        v-model="login.verify.apiData.account"
        :config="{
          placeholder: '手機號碼',
          // 不吃 modelUpdate:切換 tab 時 onReset 會清值,若清值即驗就會跳紅字
          validateEvents: ['blur', 'change'],
          inputMode: 'tel',
          length: 10,
          inputChinese: false,
          integer: true,
        }"
        :rules="{
          required: '請輸入手機號碼',
          phone: '手機號碼格式錯誤',
        }"
        :setClass="{
          main: '--h-55 --px-12 --py-5 --border --rounded',
        }"
      />
    </li>
    <li>
      <CommonMFormVerifyCountdown
        name="code"
        v-model="login.verify.apiData.code"
        :config="{
          length: 6,
          placeholder: '請輸入 6 位數驗證碼',
          // 不吃 modelUpdate:切換 tab 時 onReset 會清值,若清值即驗就會跳紅字
          validateEvents: ['blur', 'change'],
          message: {
            timeout: '{timeout} 秒後重送',
            reSend: '發送驗證碼',
          },
          isDisabled: {
            button:
              !login.verify.apiData.account || !/^09\d{8}$/.test(login.verify.apiData.account),
          },
        }"
        :rules="{
          required: '請輸入數驗證碼',
          minlength: '請輸入 {length} 位數驗證碼',
        }"
        :setClass="{
          main: '--rounded --h-55 --px-12',
          button: '--h-35 --px-15',
        }"
        @submit="onSubmit"
      />
    </li>
  </ul>
</template>
