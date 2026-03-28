<script setup>
import TabDefaultOval from '@components/buy/mTab/DefaultOval.vue'
import Anchor from '@components/buy/mAnchor.vue'

import Purpose from '@pages/buy/_components/_Purpose.vue'
import Price from '@pages/buy/_components/_Price.vue'
import Room from '@pages/buy/_components/_Room.vue'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'

const project = useProjectStore()
const home = useHomeStore()
const { options } = storeToRefs(project)
const { region } = storeToRefs(home)
const route = useRoute()
const emits = defineEmits(['search'])
const items = readonly([
  {
    id: 'region',
    label: '區域找房',
    icon: 'icon_loaction',
    to: {
      name: 'buy-region',
      query: {
        pg: 1,
      },
    },
  },
  {
    id: 'mrt',
    label: '捷運找房',
    icon: 'icon_mrt',
    to: {
      name: 'buy-mrt',
      query: {
        pg: 1,
      },
    },
  },
  {
    id: 'map',
    label: '地圖找房',
    icon: 'icon_map',
  },
])

const matchRoute = computed(() => route.matched[route.matched.length - 1])
const channelName = computed(() => matchRoute.value?.meta.channel ?? null)

const onSearch = () => {
  emits('search')
}
</script>

<template>
  <TabDefaultOval
    :items="items"
    :config="{
      containerMode: 'single',
    }"
    :setClass="{
      main: '--anchor-height-50 --green-8b0d mx-auto p:max-w-[1200px]',
      headerItem: 'm:flex-1',
      anchor: 'm:w-full p:w-[160px]',
    }"
  >
    <div class="p:pb-[15px] p:pt-[25px]">
      <div class="p:flex p:gap-x-[5px]">
        <ul class="pt:flex pt:grow p:gap-x-[5px]">
          <li>
            <!-- <FormSelectDropdown name="regionDropdown" v-if="channelName === 'region'">
              {{ region }}
            </FormSelectDropdown> -->
          </li>
          <li class="p:w-[155px]">
            <Purpose name="purpose" @change="onSearch" />
          </li>
          <li class="p:w-[155px]">
            <Price name="price" @change="onSearch" />
          </li>
          <li class="p:w-[155px]">
            <Room name="room" @change="onSearch" />
          </li>
        </ul>
        <Anchor
          text="搜尋"
          :config="{
            icon: 'icon_search',
          }"
          :setClass="{
            main: '--bg-orange-e646 --text-white --oval p:--h-45 p:--px-20',
            icon: 'h-[16px] w-[16px]',
          }"
          @click="onSearch"
        />
      </div>

      <!-- <SearchRegion
        v-model:purpose="modelPurpose"
        @search="onSearch"
        v-if="channelName === 'region'"
      />
      <SearchMrt v-if="channelName === 'mrt'" /> -->
    </div>
  </TabDefaultOval>
</template>

<style></style>
