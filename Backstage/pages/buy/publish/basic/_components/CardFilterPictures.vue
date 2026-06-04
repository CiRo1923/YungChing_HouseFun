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

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
const items = computed(() => {
  return [
    {
      id: 'photos',
      class: 'p:h-[50px]',
      component: PageBuyPublishBasicPicturesPhotos,
      hasEmits: false,
    },
    {
      id: 'layoutDiagram',
      label: '格局圖',
      class: 'pt:h-[25px]',
      hidden: ['8'], // 8 土地;
      component: PageBuyPublishBasicPicturesLayoutDiagram,
      hasEmits: false,
    },
  ]
})

const visibleItems = computed(() => {
  return items.value.filter((item) => {
    const isHidden = item.hidden?.includes(casePurposeToken.value)
    const isVisibleOnly = item.visible?.length

    if (isHidden) return false

    if (isVisibleOnly) {
      return item.visible.includes(casePurposeToken.value)
    }

    return true
  })
})
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="visibleItems">
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
