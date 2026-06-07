<script setup>
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)
</script>

<template>
  <ul class="m:space-y-[16px] pt:flex pt:flex-wrap pt:gap-x-[24px] pt:gap-y-[8px]">
    <li v-for="(item, index) in options.barrierFree" :key="`${item.code}_${index}`">
      <BuyMFormCheckBox
        :name="`caseBarrierfreeToken[${index}]`"
        v-model="apiData.caseInfo.caseBarrierfreeToken"
        :config="{
          align: 'center',
          label: item.text,
          value: item.code,
          isJoin: true,
        }"
        :setClass="{
          main: '--h-40',
          label: 'text-[16px]',
        }"
        v-if="item.code !== '999'"
      />
      <div class="flex pt:gap-x-[8px]" v-if="item.code === '999'">
        <BuyMFormCheckBox
          :name="`caseBarrierfreeToken[${index}]`"
          v-model="apiData.caseInfo.caseBarrierfreeToken"
          :config="{
            align: 'center',
            label: item.text,
            value: item.code,
            isJoin: true,
          }"
          :setClass="{
            main: '--h-40',
            label: 'text-[16px]',
          }"
        />
        <BuyMFormInput
          name="caseBarrierfreeOther"
          v-model="apiData.caseInfo.caseBarrierfreeOther"
          :config="{
            isDisabled: apiData.caseInfo.caseBarrierfreeToken !== '999',
          }"
          :rules="{
            required: '請輸入其他原因',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8',
          }"
        />
      </div>
    </li>
  </ul>
</template>

<style></style>
