<script setup>
const note = shallowReadonly({
  label: 'disc',
  items: [
    {
      item: '如要取消選取，再次點擊即可。',
    },
    {
      item: '無法選取的時段為您已設定時段。',
    },
  ],
})
</script>

<template>
  <BuyMItemMain
    :data="note"
    :setClass="{
      main: 'text-[16px] text-[--gray-666]',
      item: 'tracking-wider',
    }"
  />
</template>

<style lang="postcss"></style>
