<script setup>
import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/Content.vue'
import DealInfo from '@pages/buy/list/_components/item/DealInfo.vue'
import PopupDeal from '@pages/buy/list/_components/popup/Deal.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'
import useBuyListActions from '@stores/buy/.composables/useListActions.js'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiPOSTRealEstateSearch } = useBuyListActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// copy (複製資料)
const funEventsItem = ['copy']

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(3)

  done()
}

await onWithLoadingAll([useAsyncData(`list-done-${page.value}`, () => onUpdate())])

onUseMeta({
  title: `物件管理 - 已成交 | ${buyProject.NAME}`,
  description: '',
  url: useRequestURL(),
})
</script>

<template>
  <BuyMContainer
    :setClass="{
      main: '--px-16',
    }"
  >
    <template #header_tools>
      <ItemsInfo />
    </template>
    <TabDefaultOval />
    <Content :funEventsItem="funEventsItem" @update="onUpdate" v-slot="{ item, dealFun }">
      <DealInfo :data="item" @click:deal="dealFun" />
    </Content>
  </BuyMContainer>
  <PopupDeal />
</template>

<style></style>
