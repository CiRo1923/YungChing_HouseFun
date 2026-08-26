<script setup>
// const buyProject = useBuyProjectStore()
// const { options } = storeToRefs(buyProject)
import { onUnicodLength } from '@js/_prototype.js'

const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
const highQualityWordCount = 15

// 以字素叢集計算，emoji、罕用字（surrogate pair）皆算 1 字
const remainingWordCount = computed(() => {
  return highQualityWordCount - onUnicodLength(apiData.value.caseInfo.caseTitle)
})
</script>

<template>
  <CommonMFormInput
    name="caseTitle"
    v-model="apiData.caseInfo.caseTitle"
    :config="{
      placeholder: '請輸入物件標題',
      maxlength: 25,
      formatLength: '{length} / {maxlength}',
    }"
    :rules="{
      required: '請輸入物件標題',
    }"
    :setClass="{
      main: '--h-40 --px-12 --py-8',
      element: 'grow',
      length: 'text-[14px] text-[--gray-999]',
      suffix: 'block text-[14px] text-[--gray-999] tm:mt-[8px] p:mt-[4px]',
    }"
  >
    <template #suffix>
      <p class="before:content-[attr(data-label)]" data-label="•">
        <template v-if="remainingWordCount > 0">
          還差
          <span class="text-[--orange-e646]">{{ remainingWordCount }}</span>
          個字符合優質排序
        </template>
        <template v-else>已符合優質排序</template>
      </p>
    </template>
  </CommonMFormInput>
</template>

<style></style>
