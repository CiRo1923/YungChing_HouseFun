<script setup>
import ImgSrc from '@components/common/ImgSrc.vue'
import FormRadiosOval from '@components/buy/mForm/RadiosOval.vue'

import RadiosOval from '@pages/buy/_containers/RadiosOval.vue'

import { onGetYouTubeID } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { apiData, options } = storeToRefs(buyProject)
const videoPicture = computed(() => {
  const { caseVideoUrl } = apiData.value
  const youtubeID = /youtube/.test(caseVideoUrl) ? onGetYouTubeID(caseVideoUrl) : null

  if (youtubeID) return `https://img.youtube.com/vi/${youtubeID}/hqdefault.jpg`

  return ''
})
</script>

<template>
  <RadiosOval>
    <FormRadiosOval
      name="caseVideoDisplayToken"
      v-model="apiData.caseVideoDisplayToken"
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
      v-if="apiData.caseVideoDisplayToken === '1'"
    >
      <template v-if="!videoPicture">
        <b class="text-center tm:hidden">Video<br />290 x 163</b>
        <b class="text-center p:hidden">Video<br />311 x 175</b>
      </template>
      <ImgSrc
        :src="videoPicture"
        :setClass="{
          main: 'relative h-full w-full',
          img: 'absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2',
        }"
        v-else
      />
    </div>
    <div
      class="flex items-center justify-center overflow-hidden rounded-[10px] bg-[--gray-f7] font-semibold leading-[1.5] text-[--gray-666] tm:h-[390px] tm:w-[311px] p:h-[363px] p:w-[290px] p:text-[30px]"
      v-else
    >
      <template v-if="!videoPicture">
        <b class="text-center tm:hidden">Video<br />290 x 363</b>
        <b class="text-center p:hidden">Video<br />311 x 390</b>
      </template>
      <ImgSrc
        :src="videoPicture"
        :setClass="{
          main: 'relative h-full w-full',
          img: 'absolute left-1/2 top-1/2 h-full w-auto max-w-[inherit] -translate-x-1/2 -translate-y-1/2',
        }"
        v-else
      />
    </div>
  </RadiosOval>
</template>

<style></style>
