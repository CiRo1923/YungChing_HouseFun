<script setup>
const props = defineProps({
  minSelectCount: {
    type: Number,
    default: null,
  },
  count: {
    type: Number,
    default: null,
  },
})
const note = computed(() => {
  return {
    label: 'disc',
    items: [
      {
        item: `已設定 <span class="text-[--orange-e646]">${props.count}</span> 次，至少要設定 <span class="text-[--orange-e646]">${props.minSelectCount}</span> 次。`,
      },
      {
        item: '如要取消選取，再次點擊即可。',
      },
    ],
  }
})
</script>

<template>
  <BuyMItemMain
    :data="note"
    :setClass="{
      main: 'text-[14px] text-[--gray-666]',
      item: 'tracking-wider',
    }"
  />
</template>

<style lang="postcss"></style>
