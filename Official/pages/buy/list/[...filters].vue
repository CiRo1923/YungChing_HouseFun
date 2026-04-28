<script setup>
import Tools from '@pages/buy/_components/list/Tools.vue'
import SearchMode from '@pages/buy/_components/list/SearchMode.vue'
import Filter from '@pages/buy/_components/list/Filter.vue'
import List from '@pages/buy/_components/list/List.vue'

// import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'

definePageMeta({
  layout: 'common',
  requiresAuth: false,
})

const { onUseMeta, onIsLoading, onWithLoadingAll } = useCommonActions()

// const project = useBuyProjectStore()
// const { options } = storeToRefs(project)
const buyList = useBuyListStore()
const { pagination } = storeToRefs(buyList)
const {
  // onApiGETCitySelectOptions,
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingTypeSelectOptions,
} = useBuyProjectActions()
const { onGetBuyListParams, onApiRegion, onApiMrt, onApiBuyList, onChannel } = useBuyListActions()
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

onUseMeta({
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
  onIsLoading(true)
  await onApiBuyList(to)
  onIsLoading(false)
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
  <CommonMContainer class="--inner p:mt-[20px]">
    <CommonMContent class="pt:--rounded-20 p:--py-20">
      <Filter @info-click="onSearch" />
      <!-- <Card /> -->
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
      <List />
      <BuyMPagination
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
    </CommonMContent>
  </CommonMContainer>
</template>

<style></style>
