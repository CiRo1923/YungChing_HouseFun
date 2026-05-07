<script setup>
import PosterDataSource from '@pages/buy/basic/_components/posterInfo/PosterDataSource.vue'
import AgentName from '@pages/buy/basic/_components/posterInfo/AgentName.vue'
import AgentPhone from '@pages/buy/basic/_components/posterInfo/AgentPhone.vue'
import AgentLine from '@pages/buy/basic/_components/posterInfo/AgentLine.vue'

import CardFilter from '@pages/buy/basic/_containers/CardFilter.vue'

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
    component: PosterDataSource,
  },
  {
    id: 'agentName',
    isRequired: true,
    label: '姓名',
    class: 'p:h-[40px]',
    component: AgentName,
  },
  {
    id: 'agentPhone',
    isRequired: true,
    label: '行動電話',
    class: 'p:h-[40px]',
    component: AgentPhone,
  },
  {
    id: 'agentLine',
    isRequired: false,
    label: 'LINE 聯絡',
    class: 'p:h-[40px]',
    component: AgentLine,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
