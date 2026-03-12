<script setup>
import CardBorderContent from '@components/buy/mCard/BorderContent.vue'
import Separator from '@components/buy/mSeparator.vue'

import { numberComma } from '@js/_prototype.js'

import { useHomeStore } from '@stores/buy/home.js'

const home = useHomeStore()
const { content } = storeToRefs(home)
// const adIndex = 8
// const datas = computed(() => {
//   let result = content.value ? structuredClone(toRaw(content.value)) : []

//   if (result.length > adIndex) {
//     result.splice(adIndex, 0, {
//       id: 'ad',
//       ad: '',
//       adM: '',
//     })
//   }

//   return result
// })

const onSeparatorData = (item) => {
  const { district, buildAge, pin } = item

  return [
    {
      id: 'district',
      label: '區域',
      value: district,
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: `${buildAge} 年`,
    },
    {
      id: 'pinBuild',
      label: '總坪數',
      value: `${pin.build} 坪`,
    },
  ]
}
</script>

<template>
  <ul class="card p:grid p:grid-cols-4 p:gap-[20px] p:px-[30px]">
    <li v-for="(item, index) in content" :key="`${item.id}_${index}`">
      <CardBorderContent
        :to="{
          name: 'buy-house-hfid',
          params: {
            hfid: item.hfid,
          },
        }"
        :setClass="{
          main: 'p:--content-rounded-b-10 p:--content-p-15 p:--tools-rounded-t-5 flex h-full flex-col-reverse',
          container: 'grow',
          tools: 'shrink-0',
        }"
      >
        <section class="flex h-full flex-col leading-[1.64] p:space-y-[5px]">
          <header class="shrink-0">
            <h2 class="truncate tracking-default p:text-[18px]">
              <strong class="font-medium">{{ item.title }}</strong>
            </h2>
          </header>
          <ul class="grow p:space-y-[5px] p:text-[14px]">
            <li>
              <Separator
                :items="onSeparatorData(item)"
                :setClass="{
                  main: '--horizontal p:--gap-x-20',
                }"
              />
            </li>
            <li>
              <p>
                {{ item.layout.room }} 房 (室) {{ item.layout.living }} 廳 {{ item.layout.bath }} 衛
              </p>
            </li>
            <li v-if="item.parking.hasParking">
              <p>含車位價 {{ item.parking.price }} 萬元</p>
            </li>
            <!-- <p>price: {{ item.price }} (總價)</p>
          <p>lastPrice: {{ item.lastPrice }} (原始價格 - LastPrice 刪除線小字)</p>
          <p>parkPrice: {{ item.parking.hasParking }} {{ item.parking.price }}(車位價)</p>
          --></ul>
          <div class="flex shrink-0 items-center">
            <div class="flex grow items-center" v-if="item.lastPrice">
              <u>{{ item.lastPrice }}</u>
            </div>
            <b class="ml-auto shrink-0 font-medium text-[--red-e56a]">
              <em class="p:text-[20px]">{{ numberComma.add(item.price) }}</em>
              萬
            </b>
          </div>
        </section>
        <!-- {{ item }} -->
        <template #tools>
          <div class="relatice bg-[--gray-f7] p:h-[183px]">
            <p>gold: {{ item.badges.gold }}</p>
            <p>vr: {{ item.badges.vr }}</p>
            <p>aiTour: {{ item.badges.aiTour }}</p>
            <p>aiDecor: {{ item.badges.aiDecor }}</p>
          </div>
        </template>
      </CardBorderContent>
    </li>
  </ul>
</template>

<style></style>
