<script setup>
// 設計稿的插圖與註冊完成頁同一張(吉祥物 + 橘色打勾),沿用既有檔案不另外進圖。
</script>

<template>
  <CommonImgSrc
    src="member/register/complete/icon_complete.svg"
    alt=""
    :setClass="{
      main: 'mx-auto h-[170px] w-[160px]',
    }"
  />
  <div class="space-y-[10px] text-[16px]">
    <p>您的密碼已重新設定，請妥善保管您的會員帳號及密碼，請勿將帳號資料提供給他人知道。</p>
    <p>請使用新密碼重新登入：</p>
  </div>
  <CommonMAnchor
    text="立即登入"
    :to="{
      name: 'member-login',
    }"
    :setClass="{
      main: '--oval --bg-orange-f74c --h-55 --text-white --px-20 --text-center w-full',
      text: 'text-[16px]',
    }"
  />
</template>
