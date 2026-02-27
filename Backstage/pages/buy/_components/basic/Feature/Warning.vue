<script setup>
import Anchor from '@components/buy/mAnchor.vue'
</script>

<template>
  <div class="text-[14px] text-[--gray-666] m:hidden pt:inline-flex pt:items-center p:gap-x-[16px]">
    <p>請遵守著作權規範，勿使用他人特色描述</p>
    <p>
      <Anchor
        text="參考描述範例"
        :config="{
          icon: {
            position: 'left',
            name: 'icon_smile',
          },
        }"
        :setClass="{
          main: '--text-green-6a2d underline',
          text: 'font-normal',
          icon: 'h-[18px] w-[18px] text-[--gray-666]',
        }"
      />
    </p>
  </div>
</template>

<style></style>
