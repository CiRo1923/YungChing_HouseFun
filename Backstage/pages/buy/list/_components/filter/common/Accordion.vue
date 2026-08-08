<script setup>
const emits = defineEmits(['search'])

// 按下搜尋一併收合搜尋條件（非手風琴裝置本來就恆為展開，收合不影響顯示）
const onSearchClick = (onToggle) => {
  emits('search')
  onToggle(false)
}
</script>

<template>
  <BuyMAccordionShowHide
    :config="{
      isAccordion: {
        tm: true,
      },
      toggleText: {
        expand: '展開更多搜尋',
        collapse: '收合更多搜尋',
      },
    }"
    :setClass="{
      main: 'tm:space-y-[16px] p:flex p:items-center p:gap-x-[8px]',
      container: 'tm:space-y-[16px] p:flex p:min-w-0 p:grow p:items-center p:gap-x-[8px]',
      show: 'p:flex p:shrink-0 p:items-center p:gap-x-[8px]',
      hide: 'tm:space-y-[16px] p:flex p:min-w-0 p:grow p:items-center p:gap-x-[8px]',
      footer: 'p:shrink-0',
    }"
  >
    <slot />
    <!-- searchFun 讓插槽內容（例如搜尋欄按 Enter）觸發與「搜尋」按鈕完全相同的行為 -->
    <template #hide="{ onToggle }">
      <slot name="hide" :searchFun="() => onSearchClick(onToggle)" />
    </template>
    <template #footer="{ isAccordion, toggleText, onToggle }">
      <ul class="flex items-center justify-between">
        <li v-if="isAccordion">
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
            @click="onSearchClick(onToggle)"
          />
        </li>
      </ul>
    </template>
  </BuyMAccordionShowHide>
</template>

<style lang="postcss"></style>
