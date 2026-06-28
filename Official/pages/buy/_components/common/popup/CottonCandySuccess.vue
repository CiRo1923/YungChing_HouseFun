<script setup>
const buyProject = useBuyProjectStore()
const { cottonCandyCheckbox } = storeToRefs(buyProject)
</script>

<template>
  <BuyCommonCustomPopup
    id="popupCottonCandySuccess"
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
      已額外完成 {{ cottonCandyCheckbox.length }} 間好房留言，房仲人員將盡快與您聯繫。<br />
      提醒您，您預約的物件可能由不同的房仲人員為您服務。
    </p>
    <PageBuyCommonPopupNotMember />
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
