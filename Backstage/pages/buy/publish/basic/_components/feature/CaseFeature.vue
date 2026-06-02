<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <ul
    class="flex flex-wrap border-b-[1px] border-dashed border-b-[--gray-e5] m:gap-[12px] m:pb-[40px] pt:gap-[8px] pt:pb-[24px]"
  >
    <li v-for="(item, index) in options.feature" :key="`${item.code}_${index}`">
      <BuyMTagCheckBox
        :name="`caseFeatureToken[${index}]`"
        v-model="apiData.caseInfo.caseFeatureToken"
        :config="{
          label: item.text,
          value: item.code,
          assist: '#',
          isJoin: true,
        }"
        :setClass="{
          main: 'pt:--h-30 m:--h-35 --px-15 --py-5',
        }"
      />
    </li>
  </ul>
</template>

<style></style>
