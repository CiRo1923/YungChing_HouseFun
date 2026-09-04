<template>
  <CommonImgSrc
    src="member/forget/complete/complete.svg"
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
