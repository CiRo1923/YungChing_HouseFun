<script setup>
import TagDefault from '@components/buy/mTag/Default.vue'

import MediaImages from '@/pages/buy/_components/list/_list/MediaImages.vue'

import { numberComma, onToFixed } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/_composables/useProjectActions.js'

const project = useBuyProjectStore()
const { device } = storeToRefs(project)
const { onResize, onValueGetText } = useBuyProjectActions()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const isDeviceP = computed(() => device.value === 'p')
const addressInfo = computed(() => {
  const { address, community } = props.item
  const { name } = community || {}
  return [
    {
      id: 'address',
      value: address,
      icon: {
        name: 'icon_loaction',
        color: 'text-[--gray-999]',
      },
    },
    {
      id: 'community',
      value: name,
      icon: {
        name: 'icon_community',
        color: 'text-[--gray-666]',
      },
    },
  ]
})

const basicInfo = computed(() => {
  const { caseType, buildAge, floor, layout } = props.item
  const { from, to, up } = floor // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const isSameFloorFromTo = from === to

  return [
    {
      id: 'caseType',
      label: '型態',
      value: onValueGetText('caseType', caseType).text,
    },
    {
      id: 'buildAge',
      label: '屋齡',
      value: `${buildAge} 年`,
    },
    {
      id: 'floor',
      label: '樓層',
      value: `${from}${!isSameFloorFromTo ? ` ~ ${to}` : ''} / ${up} 樓`,
    },
    {
      id: 'layout',
      label: '格局',
      value: `${room} 房 (室) ${living} 廳 ${bath} 衛${hasAddon ? ` (含加蓋 ${addon.room} 房 (室) )` : ''}`,
    },
  ]
})

const pinParkingInfo = computed(() => {
  const { pin, parking } = props.item
  const { build, main, balcony } = pin
  const { type } = parking

  return [
    {
      id: 'pinBuild',
      label: '建坪',
      value: `建坪 ${build} 坪`,
    },
    {
      id: 'pinMainBalcony',
      label: '主陽',
      value: `主 + 陽 ${onToFixed([main, balcony])} 坪`,
    },
    {
      id: 'parkingType',
      label: '停車方式',
      value: onValueGetText('parkingType', type).text,
      isHidden: !type,
    },
  ]
})

// const config = computed(() => {
//   return {
//     index: null,
//     ...props.config,
//   }
// })
onBeforeUnmount(() => {
  onResize('remove')
})

onMounted(() => {
  onResize('add')
})
</script>

<template>
  <router-link
    :to="{
      name: 'buy-house-hfid',
      params: {
        hfid: props.item.hfid,
      },
    }"
    class="grow"
  >
    <section class="flex h-full flex-col">
      <header class="p:mb-[5px]">
        <h2 class="text-[20px] leading-[1.5]">
          <strong class="tm:font-medium">{{ props.item.title }}</strong>
        </h2>
      </header>
      <div class="flex items-end tracking-default p:space-y-[5px]">
        <div class="grow text-[14px] leading-[1.64]">
          <ul class="flex items-center p:gap-x-[12px]">
            <template v-for="(data, idx) in addressInfo">
              <li v-if="data.value" :key="`${data.id}_${idx}`">
                <p class="flex items-center">
                  <CommonSvgIcon
                    v-if="isDeviceP"
                    :icon="data.icon.name"
                    class="p:h-[20px] p:w-[20px] p:p-[1px]"
                    :class="['tm:hidden', data.icon.color]"
                  />
                  <em>{{ data.value }}</em>
                </p>
              </li>
            </template>
          </ul>
          <BuyMSeparator
            :items="basicInfo"
            :setClass="{
              main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
            }"
          />
          <BuyMSeparator
            :items="pinParkingInfo"
            :setClass="{
              main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
            }"
          />
        </div>
        <div class="shrink-0">
          <div class="flex items-center gap-x-[8px]" v-if="props.item.lastPrice">
            <del class="text-[--gray-999] tm:text-[12px] p:text-[14px]">
              {{ props.item.lastPrice }} 萬
            </del>
            <TagDefault
              :label="`↓${props.item.priceDrop} 萬`"
              :setClass="{
                main: '--bg --orange-e646 p:--h-20 p:--px-8 p:--py-3 tm:--h-16 tm:--px-5',
                label: 'text-[12px] text-[--white]',
              }"
              v-if="props.item.priceDrop"
            />
          </div>
          <p class="text-[--red-e45c] tm:text-[12px] p:text-[16px]">
            <b class="tm:text-[20px] p:text-[30px]">{{ numberComma.add(props.item.price) }}</b> 萬
          </p>
          <p
            class="tracking-default text-[--gray-999] tm:mt-[-3px] tm:text-[12px] p:mt-[-5px] p:text-[14px]"
            v-if="props.item.parking.isPriceInclude"
          >
            含車位價 {{ props.item.parking.price }} 萬元
          </p>
        </div>
      </div>
    </section>
  </router-link>
  <div
    class="relative overflow-hidden rounded-[8px] bg-[--gray-999] m:mb-[6px] m:h-[270px] m:w-full pt:h-[190px] pt:w-[250px]"
  >
    <!-- <div class="absolute">
      <p>gold: {{ props.item.badges.gold }}</p>
      <p>vr: {{ props.item.badges.vr }}</p>
      <p>aiTour: {{ props.item.badges.aiTour }}</p>
      <p>aiDecor: {{ props.item.badges.aiDecor }}</p>
    </div> -->
    <MediaImages :datas="props.item.media.images" />
  </div>
</template>

<style></style>
