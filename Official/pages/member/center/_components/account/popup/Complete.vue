<template>
  <CommonCustomPopup
    id="popupMemberCenterAccountComplete"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <CommonMFigure
      src="member/center/account/complete.svg"
      alt=""
      :setClass="{
        main: 'mx-auto h-[170px] w-[160px]',
      }"
    />
  </CommonCustomPopup>
</template>
