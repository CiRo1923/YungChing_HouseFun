<script setup>
import TabItem from '@pages/buy/_components/basic/TabItem.vue'

const items = readonly({
  label: 'disc',
  items: [
    {
      item: '您可以輸入其他房仲網站的物件網址，系統將為您快速帶入資料，匯入後您仍可修改資料。',
    },
    {
      item: '支援匯入網站：591、Yes319、21 世紀不動產、ERA 易而安、大家房屋、大師房屋、中信房屋、太平洋房屋、台灣房屋、永春不動產、永義房屋、永慶房仲網、全國不動產、好房網、住商不動產、幸福家不動產、東森房屋、東龍不動產、信義房屋、南北房屋、惠雙房屋、群義房屋、樂屋網。',
    },
    {
      item: '各品牌物件資料更新需要作業時間，若匯入物件失敗時，請於 2-3 小時後再次匯入。',
    },
  ],
})
</script>

<template>
  <TabItem :data="items" />
</template>

<style></style>
