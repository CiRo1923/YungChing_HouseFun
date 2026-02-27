<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Warning from '@pages/buy/_components/basic/Feature/Warning.vue'
import CaseDescription from '@pages/buy/_components/basic/Feature/CaseDescription.vue'
import CaseFeature from '@pages/buy/_components/basic/Feature/CaseFeature.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'warning',
    component: Warning,
    hiddenDevice: 'm',
  },
  {
    id: 'caseDescription',
    component: CaseDescription,
  },
  {
    id: 'caseFeature',
    component: CaseFeature,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
