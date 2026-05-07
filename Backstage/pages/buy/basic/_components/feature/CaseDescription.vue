<script setup>
// import { useBuyProjectStore } from '@stores/buy/project.js'
import { useBuyBasicStore } from '@stores/buy/basic.js'

// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
const buyBasic = useBuyBasicStore()
const { apiData } = storeToRefs(buyBasic)
const highQualityWordCount = 70

const onHighQualityWordCount = (length) => {
  return highQualityWordCount - length
}
</script>

<template>
  <BuyMCkEditor4
    v-model="apiData.caseInfo.caseDescription"
    :config="{
      loadMessage: '編輯器建置中...',
      placeholder: '請輸入物件特色說明',
      maxlength: 2500,
      toolbar:
        'Bold, Underline, Italic, Strike, Subscript, Superscript, Uppercase, Lowercase, BulletedList, NumberedList',
    }"
    :setClass="{
      suffix: 'flex text-[14px] text-[--gray-999] m:flex-col tm:mt-[8px] p:mt-[4px]',
    }"
  >
    <template #suffix="{ length, maxlength }">
      <p class="before:content-[attr(data-label)]" data-label="•">
        <template v-if="onHighQualityWordCount(length) > 0">
          還差
          <span class="text-[--orange-e646]">{{ onHighQualityWordCount(length) }}</span>
          個字符合優質排序
        </template>
        <template v-else>已符合優質排序</template>
      </p>
      <small class="pt:ml-[10px]">字數限制：{{ length }} / {{ maxlength }}</small>
    </template>
  </BuyMCkEditor4>
</template>

<style></style>
