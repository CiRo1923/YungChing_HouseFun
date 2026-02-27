<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Terms from '@pages/buy/_components/basic/Terms/Terms.vue'
import Agree from '@pages/buy/_components/basic/Terms/Agree.vue'

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
    id: 'agree',
    component: Agree,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
