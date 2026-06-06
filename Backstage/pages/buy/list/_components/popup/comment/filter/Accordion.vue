<script setup>
const emits = defineEmits(['click:search'])

const onSearchClick = () => {
  emits('click:search')
}
</script>

<template>
  <BuyMAccordionShowHide
    :config="{
      isAccordion: {
        m: true,
      },
      toggleText: {
        expand: '展開更多搜尋',
        collapse: '收合更多搜尋',
      },
    }"
    :setClass="{
      main: 'mb-[24px] m:space-y-[16px] pt:flex pt:items-center pt:gap-x-[8px]',
      container: 'm:space-y-[16px] pt:flex pt:min-w-0 pt:grow pt:items-center pt:gap-x-[8px]',
      show: 'pt:flex pt:shrink-0 pt:items-center pt:gap-x-[8px]',
      hide: 'm:space-y-[16px] pt:flex pt:min-w-0 pt:grow pt:items-center pt:gap-x-[8px]',
      footer: 'pt:shrink-0',
    }"
  >
    <PageBuyListPopupCommentFilterStatus />
    <template #hide>
      <PageBuyListPopupCommentFilterType />
      <PageBuyListPopupCommentFilterSearch />
    </template>
    <template #footer="{ device, toggleText, onToggle }">
      <ul class="flex items-center justify-between">
        <li v-if="device === 'm'">
          <BuyMAnchor
            :text="toggleText"
            :setClass="{
              main: '--border-gray-e5 --bg-white --oval --h-30 --px-20 --text-gray-666',
            }"
            @click="onToggle"
          />
        </li>
        <li>
          <BuyMAnchor
            text="搜尋"
            :setClass="{
              main: '--bg-green-6a2d --oval --h-35 --px-20 --text-white',
            }"
            @click="onSearchClick"
          />
        </li>
      </ul>
    </template>
  </BuyMAccordionShowHide>
</template>

<style lang="postcss"></style>
