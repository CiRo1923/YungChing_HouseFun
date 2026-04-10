<script setup>
import Container from '@components/common/mContainer.vue'
import Content from '@components/common/mContent.vue'
import Pagination from '@components/buy/mPagination.vue'

import Tools from '@pages/buy/_components/list/Tools.vue'
import SearchMode from '@pages/buy/_components/list/SearchMode.vue'
import Filter from '@pages/buy/_components/list/Filter.vue'
import List from '@pages/buy/_components/list/List.vue'

import { useMeta } from '@composable/useMeta.js'

import { useCommonStore } from '@stores/common.js'
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useBuyListStores from '@stores/buy/_composables/useListStores.js'

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const common = useCommonStore()
const { onWithLoadingAll } = common
// const project = useBuyProjectStore()
// const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { pagination } = storeToRefs(buyList)
const {
  // onApiGETCitySelectOptions,
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingTypeSelectOptions,
} = useBuyProjectStores()
const { onGetBuyListParams, onApiRegion, onApiMrt, onApiBuyList, onChannel } = useBuyListStores()
const route = useRoute()

onChannel()

onGetBuyListParams()

await onWithLoadingAll([
  useAsyncData('region-options', () => onApiRegion()),
  useAsyncData('mrt-options', () => onApiMrt()),
  useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('parking-type-options', () => onApiGETRealEstateParkingTypeSelectOptions()),
  useAsyncData('buy-list-region', () => onApiBuyList()),
])

useMeta({
  title: '買屋、購屋、買房子 | 好房網買屋',
  description:
    '好房網教你用聰明、買好房!好房網每天更新待售房屋、租屋、實價登錄資訊，還有好房網 News 及好房網 TV，製作包羅萬象的房地產消息，讓你買房的路上不孤單，好房網陪你買房！',
  url: useRequestURL(),
})

const onRouteChanged = async (to) => {
  onChannel(to)
  onGetBuyListParams(to)

  await onSearch(to)

  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const onSearch = async (to) => {
  common.onIsLoading(true)
  await onApiBuyList(to)
  common.onIsLoading(false)
}

onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) return
  await onRouteChanged(to)
})
</script>

<template>
  <!-- <pre>{{ onParseFilters() }}</pre> -->
  <!-- <pre>
    {{ route }}
  </pre> -->
  <!-- <div>
    <pre
      >{{ options.city }}
    </pre>
  </div> -->
  <Tools>
    <SearchMode />
  </Tools>
  <Container class="--inner p:mt-[20px]">
    <Content class="pt:--rounded-20 p:--py-20">
      <Filter @info-click="onSearch" />
      <!-- <Card /> -->
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
      <List />
      <Pagination
        :route="{
          name: buyList.basicRouteName,
          params: route.params,
        }"
        :config="{
          nowPage: pagination.page,
          itemsPage: pagination.pageSize,
          pageNumber: 5,
          total: pagination.total,
          queryKey: 'pg',
        }"
        :setClass="{
          main: 'p:mt-[40px]',
        }"
      />
    </Content>
  </Container>
  <div />
</template>

<style></style>
