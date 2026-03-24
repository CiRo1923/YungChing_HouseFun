<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Video from '@pages/buy/_components/basic/media/Video.vue'
import CaseVideoDisplay from '@pages/buy/_components/basic/media/CaseVideoDisplay.vue'
import Note from '@pages/buy/_components/basic/media/Note.vue'

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
