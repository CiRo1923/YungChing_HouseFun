<script setup>
import Item from '@components/buy/mItem/Main.vue'

const note = readonly({
  label: 'disc',
  items: [
    {
      item: '目前僅支援 Youtube、Facebook、Instagram、Tiktok 平台之影音連結',
    },
    {
      item: '此為預先設定資料，於<b class="text-[--gray-666]">設定黃金曝光廣告後，自動顯示於物件頁中</b>',
    },
  ],
})
</script>

<template>
  <Item
    :data="note"
    :setClass="{
      container: 'text-[14px] text-[--gray-999]',
      item: 'tracking-[0.043em]',
    }"
  />
</template>

<style></style>
