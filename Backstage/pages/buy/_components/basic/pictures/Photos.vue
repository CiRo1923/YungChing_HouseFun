<script setup>
// import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

// const common = useCommonStore()
const { onIsLoading } = useCommonActions()
// const buyProject = useBuyProjectStore()
// const { basic } = useBuyProjectActions()
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
const { onApiPOSTRealEstatePicUpload } = useBuyBasicActions()
const route = useRoute()
const hfID = computed(() => route.params.id)
const hasCasePictures = computed(() => apiData.value.caseInfo?.casePictures.length !== 0)

const message = computed(() => {
  const picturesLength = buyBasic.pictures.maxCount
  const { caseInfo } = apiData.value
  const casePictures = caseInfo.casePictures || []
  const casePicturesLength = casePictures.length
  const basicText = `圖片大小不可超過 ${buyBasic.pictures.maxSizeMB} MB，僅支援 jpg、png、gif 格式，拖動照片調整排序，`

  return casePicturesLength >= picturesLength
    ? `${basicText}已達可上傳張數上限`
    : `${basicText}還可上傳 <span class="text-[--orange-e646]">${picturesLength - casePicturesLength}</span> 張照片`
})

const onPicturesDelete = () => {
  apiData.value.caseInfo.casePictures = []
}

const onUploaded = async (items, done) => {
  onIsLoading(true)
  const { status, data } = await onApiPOSTRealEstatePicUpload({
    hfid: hfID.value,
    imgType: 1, // (1: 物件圖片; 2: 格局圖)
    imgUpload: items[0].file,
  })

  console.log(status)

  if (status === 200) {
    done(data)
  }

  onIsLoading(false)
}
</script>

<template>
  <div>
    <!-- <pre class="max-w-[500px] overflow-hidden whitespace-pre-line">
      {{ apiData.caseInfo.casePictures }}
    </pre> -->
    <div class="pt:flex pt:items-center">
      <p class="grow tracking-wider text-[--gray-999] p:text-[14px]" v-html="message" />
      <BuyMAnchor
        :text="`刪除已勾選 ${apiData.caseInfo.casePictures.length} 張`"
        :setClass="{
          main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --py-8 --text-gray-666 shrink-0',
          text: 'font-normal p:text-[14px]',
        }"
        @click="onPicturesDelete"
        v-if="hasCasePictures"
      />
    </div>

    <BuyMUploadMultiple
      v-model="apiData.caseInfo.casePictures"
      :config="{
        accept: '.jpg, .jpeg, .png, .gif',
        maxCount: buyBasic.pictures.maxCount,
        maxSizeMB: buyBasic.pictures.maxSizeMB,
        placeholder: {
          default: '點擊或拖曳圖片到這裡上傳',
          hasImages: '新增圖片',
        },
      }"
      :rules="{
        accept: '僅支援 { accept } 格式',
        maxCount: '圖片最多上傳限制為 { maxCount } 張',
        maxSize: '圖片大小不可超過 { maxSizeMB } MB',
      }"
      :setClass="{
        main: 'p:mt-[16px]',
      }"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style></style>
