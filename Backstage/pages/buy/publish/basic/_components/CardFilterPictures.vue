<script setup>
import {
  PageBuyPublishBasicPicturesPhotos,
  PageBuyPublishBasicPicturesLayoutDiagram,
} from '#components'

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
    component: PageBuyPublishBasicPicturesPhotos,
  },
  {
    id: 'layoutDiagram',
    label: '格局圖',
    class: 'pt:h-[25px]',
    component: PageBuyPublishBasicPicturesLayoutDiagram,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items">
    <template #photos_label>
      <p class="flex m:items-center m:gap-x-[16px] pt:flex-col">
        <em>物件照片</em>
        <small class="text-[14px] text-[--gray-666]">
          {{ apiData.caseInfo.casePictures.length }} / {{ buyPublish.pictures.maxCount }}
        </small>
      </p>
    </template>
  </PageBuyPublishBasicCardFilter>
</template>

<style></style>
