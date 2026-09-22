<script setup>
const emits = defineEmits(['compare', 'delete'])
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="flex gap-[10px] tm:w-full tm:justify-between p:shrink-0 p:flex-col">
    <!-- 留言要開留言燈箱,那一支目前綁在買屋頻道;接上之前先不掛行為。 -->
    <CommonMAnchor
      text="留言"
      :config="{
        icon: {
          name: 'icon_dialogue',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --border-orange-f74c --h-35 --px-15 --text-orange-e646 gap-x-[5px]',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[1px]',
      }"
    />
    <!-- icon 暫用側欄那一支;設計稿是文件加放大鏡,現有的是房子造型。 -->
    <CommonMAnchor
      text="比較"
      :config="{
        isDisabled: !props.item.canCompare,
        icon: {
          name: 'icon_house_compare',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --border-gray-e5 --h-35 --px-15 --text-gray-666 gap-x-[5px]',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px]',
      }"
      @click="emits('compare')"
    />
    <CommonMAnchor
      text="刪除"
      :config="{
        icon: {
          name: 'icon_trash_can',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--oval --border-gray-e5 --h-35 --px-15 --text-gray-666 gap-x-[5px]',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px]',
      }"
      @click="emits('delete')"
    />
  </div>
</template>
