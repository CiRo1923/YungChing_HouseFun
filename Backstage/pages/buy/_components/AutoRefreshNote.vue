<script setup>
const data = shallowReadonly({
  label: 'disc',
  items: [
    {
      item: '於刷新有效期內，每日的設定時間，系統將自動刷新物件的排序。',
    },
    {
      item: '刷新的物件，在設定的時間將會被排在物件列表的較前面的順序。',
    },
    {
      item: '搭配物件黃金曝光，讓您的物件更容易被看到！',
    },
    {
      item: '更改 / 增加刷新時間後，將於隔日生效。',
    },
  ],
})
</script>

<template>
  <BuyMItemMain
    :data="data"
    :setClass="{
      main: 'mt-[24px] text-[14px] text-[--gray-666]',
      item: 'tracking-wider',
    }"
  />
</template>

<style lang="postcss"></style>
