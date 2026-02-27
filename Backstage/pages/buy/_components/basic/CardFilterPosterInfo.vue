<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import InfoImport from '@pages/buy/_components/basic/PosterInfo/InfoImport.vue'
import AgentName from '@pages/buy/_components/basic/PosterInfo/AgentName.vue'
import AgentPhone from '@pages/buy/_components/basic/PosterInfo/AgentPhone.vue'
import AgentLine from '@pages/buy/_components/basic/PosterInfo/AgentLine.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'infoImport',
    isRequired: false,
    label: '匯入資訊',
    class: 'p:h-[35px]',
    component: InfoImport,
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
