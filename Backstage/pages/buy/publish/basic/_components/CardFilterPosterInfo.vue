<script setup>
import {
  PageBuyPublishBasicPosterInfoPosterDataSource,
  PageBuyPublishBasicPosterInfoAgentName,
  PageBuyPublishBasicPosterInfoAgentPhone,
  PageBuyPublishBasicPosterInfoAgentLine,
} from '#components'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'posterDataSource',
    isRequired: false,
    label: '匯入資訊',
    class: 'p:h-[35px]',
    component: PageBuyPublishBasicPosterInfoPosterDataSource,
    hasEmits: false,
  },
  {
    id: 'agentName',
    isRequired: true,
    label: '姓名',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPosterInfoAgentName,
    hasEmits: false,
  },
  {
    id: 'agentPhone',
    isRequired: true,
    label: '行動電話',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPosterInfoAgentPhone,
    hasEmits: false,
  },
  {
    id: 'agentLine',
    isRequired: false,
    label: 'LINE 聯絡',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPosterInfoAgentLine,
    hasEmits: false,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
