<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Terms from '@pages/buy/_components/basic/terms/Terms.vue'
import AgreeUserTerm from '~/pages/buy/_components/basic/terms/AgreeUserTerm.vue'

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
