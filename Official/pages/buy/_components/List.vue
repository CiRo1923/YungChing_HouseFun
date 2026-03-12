<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { numberComma } from '@js/_prototype.js'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'

const project = useProjectStore()
const home = useHomeStore()
const { options } = storeToRefs(project)
const { content } = storeToRefs(home)
const { onValueGetText } = useProjectStores()
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
  const { caseType, buildAge, floor } = item
  const { from, to, up } = floor // 樓層
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
      value: `${from}${!isSameFloorFromTo ? ` ~ ${to}` : ''} / ${up}`,
    },
  ]
}
</script>

<template>
  <ul class="list divide-y-[1px] divide-[--gray-feea] p:space-y-[30px]">
    <li
      class="flex first:pt-0 m:flex-col-reverse pt:flex-row-reverse p:px-[30px] p:pt-[30px]"
      v-for="(item, index) in content"
      :key="`${item.id}_${index}`"
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
          <header>
            <h2 class="p:text-[21px]">
              <strong>{{ item.title }}</strong>
            </h2>
          </header>
          <div>
            <ul class="flex items-center p:gap-x-[12px]">
              <template v-for="(data, index) in addressInfo">
                <li v-if="item[data.key]" :key="`${data.key}_${index}`">
                  <p class="flex items-center">
                    <SvgIcon
                      :icon="data.icon.name"
                      class="p:h-[20px] p:w-[20px]"
                      :class="data.icon.color"
                    />
                    <em>{{ item[data.key] }}</em>
                  </p>
                </li>
              </template>
            </ul>

            <p>caseType: {{ onValueGetText('caseType', item.caseType) }}</p>
            <p>buildAge: {{ item.buildAge }} 年</p>
            <p>
              floor: {{ item.floor.from }}
              <template v-if="item.floor.from !== item.floor.to"> ~ {{ item.floor.to }}</template> /
              {{ item.floor.up }} 樓
            </p>
            <p>
              layout: {{ item.layout.room }} 房 (室) {{ item.layout.living }} 廳
              {{ item.layout.bath }} 衛 (含加蓋 {{ item.layout.addon.room }} 房 (室) ) /
              {{ item.layout.hasAddon }}
            </p>
            <p>建坪 {{ item.pin.build }} 坪</p>
            <p>主 + 陽 {{ item.pin.main + item.pin.balcony ?? 0 }} 坪</p>
            <p>parking: {{ onValueGetText('parkingType', item.parking.type) }}</p>
            <p>price: {{ numberComma.add(item.price) }} 萬 / {{ item.lastPrice }}</p>
            <!-- <pre>
              {{ item }}
            </pre> -->
          </div>
        </section>
      </router-link>
    </li>
  </ul>
</template>

<style></style>
