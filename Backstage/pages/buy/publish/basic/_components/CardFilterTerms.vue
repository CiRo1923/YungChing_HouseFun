<script setup>
import { PageBuyPublishBasicTermsItems, PageBuyPublishBasicTermsAgreeUserTerm } from '#components'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'items',
    component: PageBuyPublishBasicTermsItems,
    hasEmits: false,
  },
  {
    id: 'agreeUserTerm',
    component: PageBuyPublishBasicTermsAgreeUserTerm,
    hasEmits: false,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
