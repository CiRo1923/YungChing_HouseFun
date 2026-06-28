<script setup></script>

<template>
  <ul class="flex items-center gap-x-[10px]">
    <li class="flex-1">
      <BuyMAnchor
        text="好厝邊房價表"
        :config="{
          icon: {
            name: 'icon_house_recommend',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--oval --bg-orange-f74c --text-white --px-20 --h-35 w-full gap-x-[5px]',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px]',
        }"
      />
    </li>
    <li class="flex-1">
      <BuyMAnchor
        text="看全部實價登錄"
        :setClass="{
          main: '--oval --border-gray-ccce --text-gray-666 --px-20 --h-35 w-full gap-x-[5px]',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px]',
        }"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
