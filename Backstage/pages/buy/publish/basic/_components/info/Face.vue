<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <CommonMFormSelect
    name="caseFaceToken"
    v-model.number="apiData.caseInfo.caseFaceToken"
    :options="options.face"
    :config="{
      placeholder: {
        value: '請選擇朝向',
        isToOption: true,
      },
      schema: {
        label: 'text',
        value: 'value',
      },
    }"
    :setClass="{
      type: 'text-[16px]',
      main: '--h-40 --px-12 --py-8',
    }"
  />
</template>
