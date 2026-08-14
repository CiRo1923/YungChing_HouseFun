<script setup></script>

<template>
  <CommonCustomPopup
    id="popupMemberCustomer"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <p class="rounded-[10px] bg-[--gray-f7] px-[20px] py-[15px] text-center">
      此帳號無法延後升級<br />請聯繫客服協助處理
    </p>
  </CommonCustomPopup>
</template>

<style lang="postcss"></style>
