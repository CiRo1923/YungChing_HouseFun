<script setup>
import TabItem from '@pages/buy/_components/basic/TabItem.vue'

const items = readonly({
  label: 'disc',
  items: [
    {
      item: '刊登頁一律顯示到路段名；門牌資訊，僅用於地圖定位；如為預售屋，請輸入附近門牌供地圖定位。',
    },
    {
      item: '若無法匯入資訊，您可繼續手動填寫地址及其他資訊，完成刊登。',
    },
  ],
})
</script>

<template>
  <TabItem :data="items" />
</template>

<style></style>
