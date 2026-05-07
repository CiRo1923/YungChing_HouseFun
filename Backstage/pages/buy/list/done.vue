<script setup>
import ItemsInfo from '@pages/buy/list/_components/ItemsInfo.vue'
import TabDefaultOval from '@pages/buy/list/_components/TabDefaultOval.vue'
import Content from '@pages/buy/list/_components/content/Main.vue'

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
const listAsync = useAsyncData(`list-done-${page.value}`, () => onApiPOSTRealEstateSearch(3))

await onWithLoadingAll([listAsync])

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
    <Content />
  </BuyMContainer>
</template>

<style></style>
