<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// 沒值的那一項連同它的 icon 一起不顯示,所以在這裡就濾掉。
const addressInfo = computed(() => {
  const { address, communityName } = props.item.house || {}

  return [
    {
      id: 'address',
      icon: 'icon_loaction',
      value: address,
    },
    {
      // 社區名稱是連結,但社區明細頁的網址還沒有來源 —— 先掛空的,樣式與位置照設計稿。
      id: 'communityName',
      icon: 'icon_community',
      value: communityName,
      href: 'javascript:;',
    },
  ].filter(({ value }) => value)
})
</script>

<template>
  <ul class="text-[14px] t:gap-x-[10px] pt:flex pt:flex-wrap pt:items-center p:gap-x-[15px]">
    <li
      class="flex items-center gap-x-[3px]"
      v-for="({ id, icon, value, href }, index) in addressInfo"
      :key="`${id}_${index}`"
    >
      <CommonMSvgIcon :icon="icon" class="h-[16px] w-[16px] p-[1px] text-[--gray-666]" />
      <CommonMAnchor
        :text="value"
        :href="href"
        :setClass="{
          text: 'underline',
        }"
        v-if="href"
      />
      <p v-else>{{ value }}</p>
    </li>
  </ul>
</template>
