<script setup>
import { datas } from '@pages/buy/_composables/useBuyBasicPage.js'
</script>

<template>
  <ul class="tm:space-y-[24px] p:space-y-[32px]">
    <li v-for="(item, index) in datas" :key="`${item.id}_${index}`">
      <component :title="item.label" :is="item.component" />
    </li>
  </ul>
</template>

<style></style>
