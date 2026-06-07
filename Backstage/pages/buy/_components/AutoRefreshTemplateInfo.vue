<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const info = computed(() => autoRefresh.value.templateSave.info || {})
const currentCount = computed(() => info.value.currentCount || 0)
const template = computed(() => autoRefresh.value.templateSave.list || [])

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const onItemClick = async (item, index) => {
  const { isCustom, templateID } = item

  autoRefresh.value.templateSave.selectedIndex = index
  autoRefresh.value.templateSave.apiData.templateID = templateID
  autoRefresh.value.templateSave.apiData.isCustom = isCustom
  autoRefresh.value.templateSave.apiData.listSelectedRefreshTime = [0] // 固定傳 0
}
</script>

<template>
  <div
    class="mx-auto pt:flex pt:grow pt:flex-col pt:overflow-hidden p:w-[820px] p:px-[4px]"
    :class="setClass.main"
  >
    <div class="pt:shrink-0">
      <p class="shrink-0 text-center text-[16px] tracking-wider text-[--gray-666]">
        物件已設定
        <span class="font-semibold text-[--orange-e646]">{{ currentCount }}</span>
        次，<br class="pt:hidden" />請選擇至少設定
        <span class="font-semibold text-[--orange-e646]">{{ currentCount }}</span>
        次的範本
      </p>
    </div>
    <ul class="scrollbar --y mt-[16px] m:space-y-[8px] pt:grow pt:space-y-[8px] p:px-[6px]">
      <li
        v-for="(item, index) in template"
        :key="`${item.tempalteID}_${item.templateName}_${index}`"
      >
        <BuyMFormRadioItem
          name="tempalteID"
          v-model="autoRefresh.templateSave.apiData.templateID"
          :config="{
            value: item.templateID,
            isDisabled: item.isDisabled,
          }"
          :setClass="{
            main: 'p:--px-40 p:--py-16 tm:--p-16',
            label: 'text-[16px] text-[--gray-666] m:space-y-[5px] pt:flex pt:items-center',
          }"
          @change="onItemClick(item, index)"
        >
          <p class="pt:grow">{{ item.templateName }}</p>
          <div class="flex items-center p:gap-x-[55px]">
            <p class="m:grow pt:shrink-0">
              刷新
              <span class="font-semibold text-[--orange-e646]">{{ item.refreshCount }}</span> 次
            </p>
            <PageBuyAutoRefreshEditTemplateAnchor :data="item" />
          </div>
        </BuyMFormRadioItem>
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
