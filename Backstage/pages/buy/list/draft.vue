<script setup>
import popupGolden from '@pages/buy/_components/popup/Golden.vue'

import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/Content.vue'
import DraftInfo from '@pages/buy/list/_components/item/DraftInfo.vue'
import PopupRenewal from '@pages/buy/list/_components/popup/Renewal.vue'
import PopupFinish from '@pages/buy/list/_components/popup/Finish.vue'
import PopupDeal from '@pages/buy/list/_components/popup/Deal.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'
import useBuyProjectActions from '@stores/buy/.composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/.composables/useListActions.js'

definePageMeta({
  layout: 'buy',
  requiresAuth: true,
  title: '物件管理',
})

const buyProject = useBuyProjectStore()
const { onUseMeta, onWithLoadingAll } = useCommonActions()
const { onApiGetPublishAvailablePlans, onApiGETGoldenGetPlanList } = useBuyProjectActions()
const { onApiPOSTRealEstateSearch } = useBuyListActions()
const route = useRoute()
const page = computed(() => route.query.pg)
// publish (刊登) / deal (成交)
const funEventsItem = ['publish', 'deal']
// editor (修改) / deal (成交)
const contentEventsItem = ['editor', 'deal']

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(2)

  done()
}

await onWithLoadingAll([
  useAsyncData(`list-draft-${page.value}`, () => onUpdate()),
  useAsyncData('available-plans-draft', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-draft', () => onApiGETGoldenGetPlanList()),
])

onUseMeta({
  title: `物件管理 - 草稿區 | ${buyProject.NAME}`,
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
    <Content
      :funEventsItem="funEventsItem"
      :contentEventsItem="contentEventsItem"
      v-slot="{ item, publishFun }"
      @update="onUpdate"
    >
      <DraftInfo :data="item" @click:publish="publishFun" class="m:mt-[24px]" />
    </Content>
  </BuyMContainer>
  <PopupRenewal />
  <PopupFinish />
  <PopupDeal />
  <popupGolden />
</template>

<style></style>
