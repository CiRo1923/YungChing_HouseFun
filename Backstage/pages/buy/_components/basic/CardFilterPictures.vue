<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Photos from '@pages/buy/_components/basic/pictures/Photos.vue'
import LayoutDiagram from '@pages/buy/_components/basic/pictures/LayoutDiagram.vue'

// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

// const buyProject = useBuyProjectStore()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
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
          {{ apiData.caseInfo.casePictures.length }} / {{ buyBasic.pictures.maxCount }}
        </small>
      </p>
    </template>
  </CardFilter>
</template>

<style></style>
