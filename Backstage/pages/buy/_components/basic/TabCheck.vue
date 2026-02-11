<script setup>
import TabCheck from '@components/buy/mTab/Check.vue'

import TabCheckURL from '@pages/buy/_components/basic/TabCheckURL.vue'
import TabCheckAddress from '@pages/buy/_components/basic/TabCheckAddress.vue'
import TabCheckID from '@pages/buy/_components/basic/TabCheckID.vue'

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
  <TabCheck
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
  </TabCheck>
</template>

<style></style>
