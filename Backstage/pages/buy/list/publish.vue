<script setup>
import popupGolden from '@pages/buy/_components/popup/Golden.vue'

import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/Content.vue'
import Setting from '@pages/buy/list/_components/item/Setting.vue'
import PopupRenewal from '@pages/buy/list/_components/popup/Renewal.vue'
import PopupOffline from '@pages/buy/list/_components/popup/Offline.vue'
import PopupDeal from '@pages/buy/list/_components/popup/Deal.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'

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
// renewal (續刊) / offline (下架) / deal (成交)
const funEventsItem = ['renewal', 'offline', 'deal']
// editor (修改) / offline (下架) / deal (成交)
const contentEventsItem = ['editor', 'offline', 'deal']
const page = computed(() => route.query.pg)

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(1)

  done()
}

await onWithLoadingAll([
  useAsyncData(`list-publish-${page.value}`, () => onUpdate()),
  useAsyncData('available-plans-publish', () => onApiGetPublishAvailablePlans()),
  useAsyncData('golden-planList-publish', () => onApiGETGoldenGetPlanList()),
])

onUseMeta({
  title: `物件管理 - 刊登中 | ${buyProject.NAME}`,
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
      v-slot="{ item, renewalFun, goldenFun }"
      @update="onUpdate"
    >
      <Setting
        :data="item"
        @click:renewal="renewalFun"
        @click:golden="goldenFun"
        class="m:mt-[24px]"
      />
    </Content>
  </BuyMContainer>
  <PopupRenewal />
  <PopupOffline />
  <PopupDeal />
  <popupGolden />
</template>

<style></style>
