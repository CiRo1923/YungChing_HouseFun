<script setup>
import CardFilterInfo from '@pages/buy/basic/_components/CardFilterInfo.vue'
import CardFilterPrice from '@pages/buy/basic/_components/CardFilterPrice.vue'
import CardFilterPing from '@pages/buy/basic/_components/CardFilterPing.vue'
import CardFilterManage from '@pages/buy/basic/_components/CardFilterManage.vue'
import CardFilterFeature from '@pages/buy/basic/_components/CardFilterFeature.vue'
import CardFilterMedia from '@pages/buy/basic/_components/CardFilterMedia.vue'
import CardFilterParking from '@pages/buy/basic/_components/CardFilterParking.vue'
import CardFilterPosterInfo from '@pages/buy/basic/_components/CardFilterPosterInfo.vue'
import CardFilterTerms from '@pages/buy/basic/_components/CardFilterTerms.vue'
import CardFilterPictures from '@pages/buy/basic/_components/CardFilterPictures.vue'

import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyBasic = useBuyBasicStore()
const componentMap = {
  CardFilterInfo,
  CardFilterPrice,
  CardFilterPing,
  CardFilterManage,
  CardFilterFeature,
  CardFilterMedia,
  CardFilterParking,
  CardFilterPosterInfo,
  CardFilterTerms,
  CardFilterPictures,
}
</script>

<template>
  <ul class="tm:space-y-[24px] p:space-y-[32px]">
    <li v-for="(item, index) in buyBasic.components" :key="`${item.id}_${index}`">
      <component :is="componentMap[item.id]" :title="item.label" />
    </li>
  </ul>
</template>

<style></style>
