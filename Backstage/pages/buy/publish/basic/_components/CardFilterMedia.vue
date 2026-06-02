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
    hasEmits: false,
  },
  {
    id: 'caseVideoDisplay',
    component: PageBuyPublishBasicMediaCaseVideoDisplay,
    hasEmits: false,
  },
  {
    id: 'note',
    component: PageBuyPublishBasicMediaNote,
    hasEmits: false,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
