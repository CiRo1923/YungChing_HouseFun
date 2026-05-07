<script setup>
import ContentItem from '@pages/buy/list/_components/content/Item.vue'

import { useBuyListStore } from '@stores/buy/list.js'

const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)
</script>

<template>
  <BuyMCardDefault
    :setClass="{
      main: 'p:mt-[32px]',
    }"
  >
    <ul class="divide-y-[1px] divide-[--gray-e5] border-b-[1px] border-b-[--gray-e5]">
      <li class="p:py-[40px]" v-for="(item, index) in datas" :key="`${item.hfID}_${index}`">
        <ContentItem :data="item" />

        <!-- <pre>
          {{ item }}
        </pre> -->
      </li>
    </ul>
  </BuyMCardDefault>
  <!-- <pre>
    {{ datas }}
  </pre> -->
</template>

<style lang="postcss"></style>
