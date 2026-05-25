<script setup>
import { onGetYouTubeID } from '@js/_prototype.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const videoPicture = computed(() => {
  const { caseVideoUrl } = apiData.value.caseInfo
  const youtubeID = /youtube/.test(caseVideoUrl) ? onGetYouTubeID(caseVideoUrl) : null

  if (youtubeID) return `https://img.youtube.com/vi/${youtubeID}/hqdefault.jpg`

  return ''
})
</script>

<template>
  <PageBuyPublishBasicRadiosOval>
    <BuyMFormRadiosOval
      name="caseVideoDisplayToken"
      v-model.number="apiData.caseInfo.caseVideoDisplayToken"
      :options="options.videoDisplay"
      :config="{
        schema: {
          label: 'text',
          value: 'value',
        },
      }"
      :setClass="{
        radios: 'm:w-full',
        container: 'm:flex-1',
      }"
    />
    <div
      class="flex items-center justify-center overflow-hidden rounded-[10px] bg-[--gray-f7] font-semibold leading-[1.5] text-[--gray-666] tm:h-[175px] tm:w-[311px] p:h-[163px] p:w-[290px] p:text-[30px]"
      v-if="apiData.caseInfo.caseVideoDisplayToken === 1 && videoPicture"
    >
      <CommonImgSrc
        :src="videoPicture"
        :setClass="{
          main: 'relative h-full w-full',
          img: 'absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2',
        }"
      />
    </div>
    <div
      class="flex items-center justify-center overflow-hidden rounded-[10px] bg-[--gray-f7] font-semibold leading-[1.5] text-[--gray-666] tm:h-[390px] tm:w-[311px] p:h-[363px] p:w-[290px] p:text-[30px]"
      v-if="apiData.caseInfo.caseVideoDisplayToken === 2 && videoPicture"
    >
      <CommonImgSrc
        :src="videoPicture"
        :setClass="{
          main: 'relative h-full w-full',
          img: 'absolute left-1/2 top-1/2 h-full w-auto max-w-[inherit] -translate-x-1/2 -translate-y-1/2',
        }"
      />
    </div>
  </PageBuyPublishBasicRadiosOval>
</template>

<style></style>
