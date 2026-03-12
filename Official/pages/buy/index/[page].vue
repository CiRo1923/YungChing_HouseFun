<script setup>
import Container from '@components/common/mContainer.vue'
import Content from '@components/common/mContent.vue'
import Pagination from '@components/buy/mPagination.vue'

import Card from '@pages/buy/_components/Card.vue'
import List from '@pages/buy/_components/List.vue'

import { awaitAllPromise } from '@js/_prototype.js'

import { useMeta } from '@composable/useMeta.js'

import { useProjectStore } from '@stores/buy/project.js'
import { useHomeStore } from '@stores/buy/home.js'
import useProjectStores from '@stores/buy/_composables/useProjectStores.js'
import useHomeStores from '@stores/buy/_composables/useHomeStores.js'

definePageMeta({
  layout: 'common',
  title: '買屋',
  requiresAuth: false,
})

useMeta({
  title: '買屋、購屋、買房子 | 好房網買屋',
  description:
    '好房網教你用聰明、買好房!好房網每天更新待售房屋、租屋、實價登錄資訊，還有好房網News及好房網TV，製作包羅萬象的房地產消息，讓你買房的路上不孤單，好房網陪你買房！',
  url: useRequestURL(),
})

const project = useProjectStore()
const home = useHomeStore()
const route = useRoute()
const { options } = storeToRefs(project)
const { pagination } = storeToRefs(home)
const {
  onApiGETCitySelectOptions,
  onApiGETRealEstateTypeSelectOptions,
  onApiGETRealEstateParkingTypeSelectOptions,
} = useProjectStores()
const { onApiBuyList } = useHomeStores()

await awaitAllPromise([
  useAsyncData('city-options', () => onApiGETCitySelectOptions()),
  useAsyncData('type-options', () => onApiGETRealEstateTypeSelectOptions()),
  useAsyncData('parking-yype-options', () => onApiGETRealEstateParkingTypeSelectOptions()),
  useAsyncData('buy-list', () => onApiBuyList()),
])
</script>

<template>
  <!-- <div>
    <pre
      >{{ options.city }}
    </pre>
  </div> -->
  <Container class="--inner p:mt-[20px]">
    <Content class="pt:--rounded-20 p:--py-20">
      <!-- <Card /> -->
      <!-- <pre>
        {{ options.caseType }}
      </pre> -->
      <List />
      <Pagination
        :route="{
          name: 'buy-index-page',
          paramsKey: 'page',
        }"
        :config="{
          nowPage: pagination.page,
          itemsPage: pagination.pageSize,
          pageNumber: 10,
          total: pagination.total,
        }"
        :setClass="{
          main: 'p:mt-[40px]',
        }"
      />
    </Content>
  </Container>
  <div></div>
</template>

<style></style>
