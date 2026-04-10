<script setup>
import TabDefaultOval from '@components/buy/mTab/DefaultOval.vue'
import Anchor from '@components/buy/mAnchor.vue'

import Region from '@pages/buy/_components/list/_searchMode/Region.vue'
import Mrt from '@pages/buy/_components/list/_searchMode/Mrt.vue'
import Purpose from '@pages/buy/_components/list/_searchMode/Purpose.vue'
import Price from '@pages/buy/_components/list/_searchMode/Price.vue'
import Room from '@pages/buy/_components/list/_searchMode/Room.vue'
import Keyword from '@pages/buy/_components/list/_searchMode/Keyword.vue'
import Condition from '@pages/buy/_components/list/_searchMode/Condition.vue'

// import { onDevice } from '@js/_prototype.js'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
// import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useBuyListStores from '@stores/buy/_composables/useListStores.js'

// const project = useBuyProjectStore()
// const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { region, mrt } = storeToRefs(buyList)
// const { onValueGetText } = useBuyProjectStores()
const { isChannelRegion, isChannelMrt, commonParams } = useBuyListStores()
// const route = useRoute()
const router = useRouter()
const paramsRegion = computed(() => {
  const { apiData } = region.value

  return apiData ? [`${apiData}_region`] : []
})

const paramsMrt = computed(() => {
  const { apiData } = mrt.value

  return apiData ? [`${apiData}_mrt`] : []
})
const paramsChannel = computed(() =>
  isChannelRegion.value ? paramsRegion.value : isChannelMrt.value ? paramsMrt.value : []
)

const items = computed(() => [
  {
    id: 'region',
    label: '區域找房',
    icon: 'icon_loaction',
    to: {
      name: buyList.basicRouteName,
      params: {
        filters: [...paramsRegion.value, ...commonParams.value],
      },
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
      name: buyList.basicRouteName,
      params: {
        filters: [...paramsMrt.value, ...commonParams.value],
      },
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

const onSearch = async () => {
  await router.push({
    name: buyList.basicRouteName,
    params: {
      filters: [...paramsChannel.value, ...commonParams.value],
    },
    query: {
      pg: 1,
    },
  })
}
</script>

<template>
  <TabDefaultOval
    :items="items"
    :config="{
      active: isChannelRegion ? 0 : isChannelMrt ? 1 : 0,
      containerMode: 'single',
    }"
    :setClass="{
      main: '--anchor-height-50 --green-8b0d mx-auto p:max-w-[1200px]',
      headerItem: 'm:flex-1',
      anchor: 'm:w-full p:w-[160px]',
    }"
  >
    <div class="search-mode p:space-y-[15px] p:pt-[25px]">
      <ul class="search-mode-content relative flex flex-wrap m:gap-x-[20px] pt:grow p:gap-x-[5px]">
        <li
          class="search-mode-item --channel relative m:order-1 tm:w-[115px] pt:shrink-0 p:w-[155px]"
        >
          <Region name="region" v-if="isChannelRegion" />
          <Mrt name="mrt" v-if="isChannelMrt" />
        </li>
        <li class="search-mode-item --purpose relative m:order-3 m:flex-1 pt:shrink-0 p:w-[155px]">
          <Purpose name="purpose" />
        </li>
        <li class="search-mode-item --price relative m:order-3 m:flex-1 pt:shrink-0 p:w-[155px]">
          <Price name="price" />
        </li>
        <li class="search-mode-item --room relative m:order-3 m:flex-1 pt:shrink-0 p:w-[155px]">
          <Room name="room" />
        </li>
        <li
          class="search-mode-item --keyword relative flex items-center gap-x-[5px] m:order-2 m:w-[240px] pt:grow"
        >
          <Keyword />
          <Anchor
            text="搜尋"
            :config="{
              icon: {
                name: 'icon_search',
                position: 'left',
              },
            }"
            :setClass="{
              main: '--bg-orange-e646 --text-white --oval pt:--h-45 tm:--px-10 p:--px-20 m:--h-40 shrink-0',
              icon: 'h-[16px] w-[16px]',
            }"
            @click="onSearch"
          />
        </li>
      </ul>
      <Condition />
    </div>
  </TabDefaultOval>
</template>

<style lang="postcss">
@screen m {
  .search-mode-content {
    &::before {
      @apply pointer-events-none absolute left-0 top-1/2 z-[1] h-[1px] w-full bg-[--gray-ccce] content-default;
    }
  }

  .search-mode-item {
    &.\-\-price,
    &.\-\-room,
    &.\-\-keyword {
      &:before {
        @apply absolute left-[-10px] top-1/2 z-0 h-[36%] w-[1px] -translate-y-1/2 bg-[--gray-ccce] content-default;
      }
    }
  }
}
</style>
