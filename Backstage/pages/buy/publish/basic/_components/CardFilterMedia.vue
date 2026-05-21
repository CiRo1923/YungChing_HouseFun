<script setup>
import {
  PageBuyPublishBasicMediaVideo,
  PageBuyPublishBasicMediaCaseVideoDisplay,
  PageBuyPublishBasicMediaNote,
} from '#components'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'video',
    component: PageBuyPublishBasicMediaVideo,
  },
  {
    id: 'caseVideoDisplay',
    component: PageBuyPublishBasicMediaCaseVideoDisplay,
  },
  {
    id: 'note',
    component: PageBuyPublishBasicMediaNote,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
