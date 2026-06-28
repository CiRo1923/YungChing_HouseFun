<script setup></script>

<template>
  <BuyCommonCustomPopup
    id="popupMessageSuccess"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <p class="rounded-[8px] bg-[--gray-f7] p-[20px] text-[16px] tracking-wider">
      已送出留言，房仲人員在收到留言後將會盡快與您聯繫。
    </p>
    <PageBuyCommonPopupNotMember />
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
