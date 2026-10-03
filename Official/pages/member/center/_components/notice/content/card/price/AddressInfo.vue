<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// 沒值的那一項連同它的 icon 一起不顯示(規格書:無社區的物件不顯示社區列)。
const addressInfo = computed(() => {
  const { address, community } = props.item.house || {}

  return [
    {
      id: 'address',
      icon: 'icon_loaction',
      value: address,
    },
    {
      // 社區名稱是連結,但社區明細頁的網址還沒有來源 —— 先掛空的,樣式與位置照設計稿。
      id: 'community',
      icon: 'icon_community',
      value: community?.name,
      href: 'javascript:;',
    },
  ].filter(({ value }) => value)
})
</script>

<template>
  <ul class="space-y-[3px] text-[14px]">
    <li
      class="flex items-center gap-x-[3px]"
      v-for="({ id, icon, value, href }, index) in addressInfo"
      :key="`${id}_${index}`"
    >
      <CommonMSvgIcon :icon="icon" class="h-[16px] w-[16px] shrink-0 p-[1px] text-[--gray-666]" />
      <CommonMAnchor
        :text="value"
        :href="href"
        :setClass="{
          text: 'line-clamp-1 underline',
        }"
        v-if="href"
      />
      <p class="line-clamp-1" v-else>{{ value }}</p>
    </li>
  </ul>
</template>
