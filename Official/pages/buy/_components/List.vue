<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import Separator from '@components/buy/mSeparator.vue'

import { numberComma, onToFixed, onDevice } from '@js/_prototype.js'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useProjectStore()
const home = useHomeStore()
const { options } = storeToRefs(project)
const { content } = storeToRefs(home)
const { onValueGetText } = useProjectStores()
const device = ref('p')
const isDeviceP = computed(() => device.value === 'p')
const addressInfo = readonly([
  {
    key: 'address',
    icon: {
      name: 'icon_loaction',
      color: 'text-[--gray-999]',
    },
  },
  {
    key: 'community',
    icon: {
      name: 'icon_community',
      color: 'text-[--gray-666]',
    },
  },
])

const onBasicInfo = (item) => {
  const { caseType, buildAge, floor, layout } = item
  const { from, to, up } = floor // 樓層
  const { room, living, bath, addon, hasAddon } = layout
  const isSameFloorFromTo = from === to

  return [
    {
      id: 'caseType',
      label: '型態',
      value: onValueGetText('caseType', caseType),
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
}

const onPinParkingInfo = (item) => {
  const { pin, parking } = item
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
      value: onValueGetText('parkingType', type),
    },
  ]
}

const onReset = () => {
  device.value = onDevice()
}

onBeforeUnmount(() => {
  window.removeEventListener('reset', onReset)
})

onMounted(() => {
  onReset()
  window.addEventListener('reset', onReset)
})
</script>

<template>
  <ul class="list divide-y-[1px] divide-[--gray-feea] m:px-[10px] p:space-y-[30px]">
    <li
      v-for="(item, index) in content"
      :key="`${item.id}_${index}`"
      class="flex first:pt-0 m:flex-col-reverse t:gap-x-[10px] pt:flex-row-reverse p:gap-x-[20px] p:px-[30px] p:pt-[30px]"
    >
      <router-link
        :to="{
          name: 'buy-house-hfid',
          params: {
            hfid: item.hfid,
          },
        }"
        class="grow"
      >
        <section class="flex h-full flex-col">
          <header class="p:mb-[5px]">
            <h2 class="text-[20px] leading-[1.5]">
              <strong class="tm:font-medium">{{ item.title }}</strong>
            </h2>
          </header>
          <div class="flex items-end tracking-default p:space-y-[5px]">
            <div class="grow text-[14px] leading-[1.64]">
              <ul class="flex items-center p:gap-x-[12px]">
                <template v-for="(data, idx) in addressInfo">
                  <li v-if="item[data.key]" :key="`${data.key}_${idx}`">
                    <p class="flex items-center">
                      <SvgIcon
                        v-if="isDeviceP"
                        :icon="data.icon.name"
                        class="p:h-[20px] p:w-[20px]"
                        :class="['tm:hidden', data.icon.color]"
                      />
                      <em>{{ item[data.key] }}</em>
                    </p>
                  </li>
                </template>
              </ul>
              <Separator
                :items="onBasicInfo(item)"
                :setClass="{
                  main: '--horizontal p:--gap-x-20',
                }"
              />
              <Separator
                :items="onPinParkingInfo(item)"
                :setClass="{
                  main: '--horizontal p:--gap-x-20',
                }"
              />
            </div>
            <div class="shrink-0">
              <p>price: {{ numberComma.add(item.price) }} 萬 / {{ item.lastPrice }}</p>
              <p>priceDrop: {{ item.priceDrop }}</p>
            </div>
          </div>
          <!-- <pre>
            {{ item }}
          </pre> -->
        </section>
      </router-link>
      <div
        class="overflow-hidden rounded-[8px] bg-[--gray-f7] m:h-[270px] m:w-full pt:h-[190px] pt:w-[250px]"
      >
        image
      </div>
    </li>
  </ul>
</template>

<style></style>
