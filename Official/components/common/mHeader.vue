<script setup></script>

<template>
  <div class="m-header relative bg-[--white] tm:h-[55px] p:h-[65px]">
    <div class="m-header-container mx-auto flex h-full tm:px-[15px] p:max-w-[1220px] p:px-[10px]">
      <div class="m-header-logo flex m:items-center m:gap-x-[3px] pt:flex-col pt:justify-center">
        <CommonImgSrc
          src="buy/logo_text.svg"
          :setClass="{
            main: 'tm:h-[24px] tm:w-[69px] p:ml-auto p:h-[30px] p:w-[88px]',
          }"
        />
        <CommonImgSrc
          src="buy/logo_icon.svg"
          :setClass="{
            main: 'tm:h-[12px] tm:w-[78px] p:mt-[-3px] p:h-[16px] p:w-[105px]',
          }"
        />
      </div>
      <CommonMNav />
    </div>
  </div>
</template>

<style lang="postcss"></style>
