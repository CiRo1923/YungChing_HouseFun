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

const message = computed(() => {
  const { caseInfo } = apiData.value
  const basicText = `圖片大小不可超過 ${buyBasic.pictures.maxSizeMB} MB，僅支援 jpg、png、gif 格式，`

  return caseInfo.caseLayout
    ? `${basicText}已符合優質排序`
    : `${basicText}還差 <span class="text-[--orange-e646]">1</span> 張符合優質排序`
})

const onUploaded = async (items, done) => {
  onIsLoading(true)
  const { status, data } = await onApiPOSTRealEstatePicUpload({
    hfid: hfID.value,
    imgType: 2, // (1: 物件圖片; 2: 格局圖)
    imgUpload: items[0].file,
  })

  if (status === 200) {
    done(data)
  }

  onIsLoading(false)
}
</script>

<template>
  <div>
    <!-- <pre class="max-w-[500px] overflow-hidden whitespace-pre-line">
      {{ apiData.caseInfo.caseLayout }}
    </pre> -->
    <p class="text-[14px] tracking-wider text-[--gray-999]" v-html="message" />
    <BuyMUploadSingle
      v-model="apiData.caseInfo.caseLayout"
      :config="{
        accept: '.jpg, .jpeg, .png, .gif',
        maxSizeMB: buyBasic.pictures.maxSizeMB,
        placeholder: '拖曳檔案至此，或點擊新增照片',
      }"
      :rules="{
        accept: '僅支援 { accept } 格式',
        maxSize: '圖片大小不可超過 { maxSizeMB } MB',
      }"
      :setClass="{
        main: 'm:mt-[24px] pt:mt-[16px]',
      }"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style></style>
