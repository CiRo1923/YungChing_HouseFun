<template>
  <CommonCustomPopup
    id="popupMemberCenterPasswordComplete"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <div class="space-y-[20px]">
      <p class="text-[16px]">您的密碼已完成重設，請利用新密碼重新登入</p>
      <CommonMFigure
        src="member/center/password/complete.svg"
        alt=""
        :setClass="{
          main: 'mx-auto h-[170px] w-[160px]',
        }"
      />
    </div>
  </CommonCustomPopup>
</template>
