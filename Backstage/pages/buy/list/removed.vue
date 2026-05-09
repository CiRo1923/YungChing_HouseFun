<script setup>
import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/Content.vue'
import RemovedInfo from '@pages/buy/list/_components/item/RemovedInfo.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'

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
// publish (刊登) / done (成交)
const funEventsItem = ['publish', 'done']
// editor (修改) / done (成交)
const contentEventsItem = ['editor', 'done']

const onUpdate = async (done) => {
  await onApiPOSTRealEstateSearch(4)

  done()
}

await onWithLoadingAll([useAsyncData(`list-remove-${page.value}`, () => onUpdate())])

onUseMeta({
  title: `物件管理 - 已下架 | ${buyProject.NAME}`,
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
      v-slot="{ item }"
      @update="onUpdate"
    >
      <RemovedInfo :data="item" class="m:mt-[24px]" />
    </Content>
  </BuyMContainer>
</template>

<style></style>
