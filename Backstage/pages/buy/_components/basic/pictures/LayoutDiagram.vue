<script setup>
import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

const buyProject = useBuyProjectStore()
const { apiData } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()

const message = computed(() => {
  const { caseInfo } = apiData.value

  return caseInfo.caseLayout ? '已符合優質排序' : '還差 1 張符合優質排序'
})
</script>

<template>
  <div>
    <p class="tracking-wider text-[--gray-999] p:text-[14px]">
      圖片大小不可超過 25 MB，僅支援 jpg、png、gif 格式，{{ message }}
    </p>
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
        main: 'p:mt-[16px]',
      }"
    />
  </div>
</template>

<style></style>
