<script setup>
import { UPGRADECOMPLETE } from '@js/_storage.js'

const { onGetCookie } = useMemberUpgradeActions()

// 剛完成綁定的號碼,遮罩由後端給(bind / merge 回傳的 maskedMobile),前端不再自己遮。
// 走到這裡代表 middleware 已放行 → cookie 一定有效。值不會變動,setup 取一次即可。
const maskPhone = onGetCookie(UPGRADECOMPLETE)
</script>

<template>
  <div class="text-center text-[16px]">
    您的登入帳號已改為<br />
    <b class="tm:text-[24px] p:text-[30px]">{{ maskPhone }}</b>
  </div>
  <CommonImgSrc
    src="member/upgrade/complete/complete.svg"
    :setClass="{
      main: 'mx-auto my-[35px] h-[170px] w-[160px]',
    }"
  />
  <p class="text-center text-[16px]">
    下次請以手機號碼登入<br />
    原 Email 將作為聯絡與帳號找回用途
  </p>
</template>
