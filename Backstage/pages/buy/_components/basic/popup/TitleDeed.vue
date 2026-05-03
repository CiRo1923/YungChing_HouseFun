<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'
</script>

<template>
  <CustomPopup
    id="popupTitleDeed"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <CommonImgSrc
      src="buy/basic/title_deed.jpg"
      :setClass="{
        main: 'mx-auto overflow-hidden rounded-[15px] t:h-[488px] t:w-[600px] p:h-[65.5vh] p:max-h-[580px] p:w-[80.68vh] p:max-w-[715px]',
      }"
    />
  </CustomPopup>
</template>

<style></style>
