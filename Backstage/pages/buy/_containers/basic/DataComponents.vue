<script setup>
import CardFilterInfo from '@pages/buy/_components/basic/CardFilterInfo.vue'
import CardFilterPrice from '@pages/buy/_components/basic/CardFilterPrice.vue'
import CardFilterPing from '@pages/buy/_components/basic/CardFilterPing.vue'
import CardFilterManage from '@pages/buy/_components/basic/CardFilterManage.vue'
import CardFilterFeature from '@pages/buy/_components/basic/CardFilterFeature.vue'
import CardFilterMedia from '@pages/buy/_components/basic/CardFilterMedia.vue'
import CardFilterParking from '@pages/buy/_components/basic/CardFilterParking.vue'
import CardFilterPosterInfo from '@pages/buy/_components/basic/CardFilterPosterInfo.vue'
import CardFilterTerms from '@pages/buy/_components/basic/CardFilterTerms.vue'
import CardFilterPictures from '@pages/buy/_components/basic/CardFilterPictures.vue'

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
