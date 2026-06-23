<script setup>
const { onReplaceImageSize } = useBuyProjectActions()
const buyHouse = useBuyHouseStore()
const { media, badges } = storeToRefs(buyHouse)
const size = {
  width: 760,
  height: 570,
}
const modeID = ref(null)
const imageIndex = ref(1)
const hasImages = computed(() => media.value.images && media.value.images.length !== 0)
const images = computed(() => (hasImages.value ? onReplaceImageSize(media.value.images, size) : []))

const ids = computed(() => {
  const idsData = ['gold', 'new']

  return idsData.filter((key) => badges.value[key] === true)
})

const mode = computed(() => {
  const { floorPlan, streetViewUrl, vrUrl, videoTourUrl, aiTourMp4, aiDecor } = media.value
  return [
    {
      id: 'floorPlan',
      label: '格局圖',
      value: floorPlan,
    },
    {
      id: 'images',
      label: '照片',
      value: images.value.length !== 0 ? images.value : null,
    },
    {
      id: 'streetView',
      label: '地圖',
      value: streetViewUrl,
    },
    {
      id: 'vr',
      label: 'VR',
      value: vrUrl,
    },
    {
      id: 'videoTour',
      label: '影音',
      value: videoTourUrl,
    },
    {
      id: 'aiTour',
      label: 'AI 導覽',
      value: aiTourMp4,
    },
    {
      id: 'aiDecor',
      label: 'AI 煥裝',
      value: aiDecor && aiDecor.length !== 0 ? aiDecor : null,
    },
  ]
})

const onModeClick = (id) => {
  modeID.value = id
}

const onImageChange = (data) => {
  const { realIndex } = data

  imageIndex.value = realIndex + 1
}

watch(
  mode,
  (list) => {
    const first = list.find((item) => item.value != null)
    modeID.value = first ? first.id : null
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div
    class="relative w-full overflow-hidden bg-[--gray-999] m:mb-[6px] m:h-[270px] m:w-full pt:h-[570px] pt:rounded-[10px]"
  >
    <!-- 黃金曝光 & NEW -->
    <PageBuyHouseBasicFlags :ids="ids" />
    <!-- 格局圖 -->
    <div class="h-full" v-if="modeID === 'floorPlan'">
      <CommonImgSrc
        :src="media.floorPlan"
        :setClass="{
          main: 'relative h-full',
          img: 'absolute left-1/2 h-full -translate-x-1/2',
        }"
      />
    </div>
    <!-- 照片 -->
    <div class="media-images relative h-full" v-if="modeID === 'images'">
      <template v-if="hasImages">
        <BuyMSwiper12
          name="houseMediaImages"
          :data="images"
          :config="{
            nav: false,
          }"
          :setClass="{
            main: 'h-full',
            nav: 'h-[30px] w-[30px] p-[6px] text-[--white]',
          }"
          v-slot="{ item }"
          @change="onImageChange"
        >
          <div class="flex h-full flex-col items-center justify-center break-keep">
            <!-- {{ onImageSize(item) }} -->
            <CommonImgSrc :src="item" />
          </div>
        </BuyMSwiper12>
        <small
          class="absolute flex h-[20px] items-center rounded-full px-[8px] text-[12px] tracking-wider text-[--white] bg-hexa-[--black,0.6] m:bottom-[55px] tm:right-[10px] pt:bottom-[65px] p:right-[15px]"
        >
          {{ imageIndex }} / {{ images.length }}
        </small>
      </template>
      <CommonImgSrc
        src="common/default_image.jpg"
        :setClass="{
          main: 'relative h-full',
          img: 'absolute left-1/2 h-full -translate-x-1/2',
        }"
        v-else
      />
    </div>
    <ul
      class="absolute left-1/2 z-[1] flex w-[calc(100%_-_20px)] -translate-x-1/2 items-center justify-center rounded-full px-[10px] bg-hexa-[--gray-333,0.8] m:bottom-[20px] tm:py-[2px] pt:bottom-[10px] p:py-[4px]"
    >
      <template v-for="(item, index) in mode" :key="`${item.label}_${index}`">
        <li v-if="item.value">
          <BuyMAnchor
            :text="item.label"
            :setClass="{
              main: [
                '--oval --text-white p:--h-35 tm:--h-25 p:--px-15 tm:--px-10',
                { '--bg-green-8b0d': modeID === item.id },
              ],
              text: 'm:text-[12px] t:text-[14px] p:text-[16px]',
            }"
            @click="onModeClick(item.id)"
          />
        </li>
      </template>
    </ul>
  </div>
</template>

<style></style>
