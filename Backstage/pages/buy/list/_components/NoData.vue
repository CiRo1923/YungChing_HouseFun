<script setup></script>

<template>
  <div class="flex flex-col">
    <div
      class="flex items-center justify-center gap-x-[10px] text-[--gray-333] t:h-[240px] p:h-[320px]"
    >
      <CommonSvgIcon icon="icon_circle_exclamation" class="h-[24px] w-[24px] text-[--gray-666]" />
      <p class="font-medium tm:text-[20px] p:text-[24px]">無物件資料</p>
    </div>

    <div class="border-t-[1px] border-t-[--gray-f7] text-center tm:pt-[32px] p:pt-[40px]">
      <BuyMAnchor
        text="開始複製物件"
        :setClass="{
          main: '--oval --h-45 --border-gray-e5 --px-30 text-[--gray-666]',
          text: 'text-[18px] tracking-wider',
        }"
      />
    </div>
  </div>
</template>

<style lang="postcss"></style>
