<script setup></script>

<template>
  <div
    class="m-header flex items-center bg-[--white] m:h-[--header-mobile-h] t:h-[--header-tablet-h] p:h-[--header-pc-h]"
  >
    <div
      class="m-header-container mx-auto flex w-full m:items-center tm:px-[15px] pt:h-full p:max-w-[1220px] p:px-[10px]"
    >
      <div
        class="m-header-logo flex m:grow m:items-end m:gap-x-[3px] pt:shrink-0 pt:flex-col pt:justify-center"
      >
        <CommonImgSrc
          src="buy/logo_text.svg"
          alt="好房網HouseFun"
          :setClass="{
            main: 'tm:h-[24px] tm:w-[69px] p:ml-auto p:h-[30px] p:w-[88px]',
          }"
        />
        <CommonImgSrc
          src="buy/logo_icon.svg"
          alt=""
          :setClass="{
            main: 'tm:h-[12px] tm:w-[78px] p:mt-[-3px] p:h-[16px] p:w-[105px]',
          }"
        />
      </div>
      <CommonMNav>
        <slot name="nav" />
      </CommonMNav>
    </div>
  </div>
</template>

<style lang="postcss">
:root {
  --header-pc-h: 65px;
  --header-tablet-h: 55px;
  --header-mobile-h: 55px;
}
</style>
