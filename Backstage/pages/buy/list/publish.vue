<script setup>
import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/Content.vue'
import Setting from '@pages/buy/list/_components/item/Setting.vue'
import PopupPlans from '@pages/buy/list/_components/popup/Plans.vue'

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
const { onApiGetVasPublishAvailablePlans } = useBuyProjectActions()
const { onApiPOSTRealEstateSearch } = useBuyListActions()
const route = useRoute()
// renewal (續刊) / removed (下架) / done (成交)
const funEventsItem = ['renewal', 'removed', 'done']
// editor (修改) / removed (下架) / done (成交)
const contentEventsItem = ['editor', 'removed', 'done']
const page = computed(() => route.query.pg)

await onWithLoadingAll([
  useAsyncData(`list-publish-${page.value}`, () => onApiPOSTRealEstateSearch(1)),
  useAsyncData('available-plans', () => onApiGetVasPublishAvailablePlans()),
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
      v-slot="{ item, renewalFun }"
    >
      <Setting :data="item" @click:renewal="renewalFun" class="m:mt-[24px]" />
    </Content>
  </BuyMContainer>
  <PopupPlans />
</template>

<style></style>
