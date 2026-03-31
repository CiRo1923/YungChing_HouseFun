<script setup>
import Container from '@components/common/mContainer.vue'
import Content from '@components/common/mContent.vue'
import Pagination from '@components/buy/mPagination.vue'

import Tools from '@pages/buy/_components/Tools.vue'
import SearchMode from '@pages/buy/_components/SearchMode.vue'
// import Card from '@pages/buy/_components/Region/Card.vue'
import Filter from '@pages/buy/_components/Filter.vue'
import List from '@pages/buy/_components/List.vue'

import { useMeta } from '@composable/useMeta.js'

import { useCommonStore } from '@stores/common.js'
import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useHomeStores from '@stores/buy/_composables/useHomeStores.js'

definePageMeta({
  layout: 'common',
  title: '區域找房',
  channel: 'region',
  requiresAuth: false,
})

const common = useCommonStore()
const project = useProjectStore()
const home = useHomeStore()
const route = useRoute()
const { options } = storeToRefs(project)
const { pagination } = storeToRefs(home)
const { onWithLoadingAll } = common
const {
  // onApiGETCitySelectOptions,
  onApiGETRealEstatePurposeCheckOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingTypeSelectOptions,
} = useProjectStores()
const { onApiRegion, onApiBuyList } = useHomeStores()

const onSearch = async () => {
  common.onIsLoading(true)

  await onApiBuyList(route.meta.channel)

  common.onIsLoading(false)
}

await onWithLoadingAll([
  // useAsyncData('city-options', () => onApiGETCitySelectOptions()),
  useAsyncData('region-options', () => onApiRegion()),
  useAsyncData('purpose-options', () => onApiGETRealEstatePurposeCheckOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('parking-type-options', () => onApiGETRealEstateParkingTypeSelectOptions()),
  useAsyncData('buy-list-region', () => onApiBuyList(route.meta.channel)),
])

watch(
  () => route.query.pg,
  async (value, prev) => {
    if (value === prev) return

    await onSearch()

    if (import.meta.client) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }
)

useMeta({
  title: '買屋、購屋、買房子 | 好房網買屋',
  description:
    '好房網教你用聰明、買好房!好房網每天更新待售房屋、租屋、實價登錄資訊，還有好房網 News 及好房網 TV，製作包羅萬象的房地產消息，讓你買房的路上不孤單，好房網陪你買房！',
  url: useRequestURL(),
})
</script>

<template>
  <!-- <pre>
    {{ route }}
  </pre> -->
  <!-- <div>
    <pre
      >{{ options.city }}
    </pre>
  </div> -->
  <Tools>
    <SearchMode @search="onSearch" />
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
          name: 'buy-region',
          queryKey: 'pg',
        }"
        :config="{
          nowPage: pagination.page,
          itemsPage: pagination.pageSize,
          pageNumber: 5,
          total: pagination.total,
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
