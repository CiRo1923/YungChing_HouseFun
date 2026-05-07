<script setup>
import TabCheckURL from '@pages/buy/basic/_components/TabCheckURL.vue'
import TabCheckAddress from '@pages/buy/basic/_components/TabCheckAddress.vue'
import TabCheckID from '@pages/buy/basic/_components/TabCheckID.vue'

const options = readonly([
  {
    label: '網址匯入',
  },
  {
    label: '地址匯入',
  },
  {
    label: '建號匯入',
  },
])
</script>

<template>
  <BuyMTabCheck
    :options="options"
    :setClass="{
      main: '--anchor-height-40 --body-py-32 p:--body-px-40 p:--body-py-32 tm:--body-px-16',
      headerItem: 'tm:flex-1 p:min-w-[160px]',
    }"
  >
    <!-- 網址匯入 -->
    <template #content_0>
      <TabCheckURL />
    </template>
    <!-- 地址匯入 -->
    <template #content_1>
      <TabCheckAddress />
    </template>
    <!-- 建號匯入 -->
    <template #content_2>
      <TabCheckID />
    </template>
  </BuyMTabCheck>
</template>

<style></style>
