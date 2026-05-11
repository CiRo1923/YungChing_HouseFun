<script setup>
import Photos from '@pages/buy/publish/basic/_components/pictures/Photos.vue'
import LayoutDiagram from '@pages/buy/publish/basic/_components/pictures/LayoutDiagram.vue'

import CardFilter from '@pages/buy/publish/basic/_containers/CardFilter.vue'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyPublishStore } from '@stores/buy/publish.js'

// const buyProject = useBuyProjectStore()
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'photos',
    class: 'p:h-[50px]',
    component: Photos,
  },
  {
    id: 'layoutDiagram',
    label: '格局圖',
    class: 'pt:h-[25px]',
    component: LayoutDiagram,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items">
    <template #photos_label>
      <p class="flex m:items-center m:gap-x-[16px] pt:flex-col">
        <em>物件照片</em>
        <small class="text-[14px] text-[--gray-666]">
          {{ apiData.caseInfo.casePictures.length }} / {{ buyPublish.pictures.maxCount }}
        </small>
      </p>
    </template>
  </CardFilter>
</template>

<style></style>
