<script setup>
import Terms from '@pages/buy/publish/basic/_components/terms/Terms.vue'
import AgreeUserTerm from '@pages/buy/publish/basic/_components/terms/AgreeUserTerm.vue'

import CardFilter from '@pages/buy/publish/basic/_containers/CardFilter.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'terms',
    component: Terms,
  },
  {
    id: 'agreeUserTerm',
    component: AgreeUserTerm,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
