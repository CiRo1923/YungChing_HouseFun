<script setup>
import Video from '@pages/buy/publish/basic/_components/media/Video.vue'
import CaseVideoDisplay from '@pages/buy/publish/basic/_components/media/CaseVideoDisplay.vue'
import Note from '@pages/buy/publish/basic/_components/media/Note.vue'

import CardFilter from '@pages/buy/publish/basic/_containers/CardFilter.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'video',
    component: Video,
  },
  {
    id: 'caseVideoDisplay',
    component: CaseVideoDisplay,
  },
  {
    id: 'note',
    component: Note,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
