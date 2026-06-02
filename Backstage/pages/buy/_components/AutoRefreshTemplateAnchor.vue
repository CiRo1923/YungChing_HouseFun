<script setup>
const onClick = () => {
  console.log('套用範本設定')
}
</script>

<template>
  <BuyMAnchor
    text="套用範本設定"
    :config="{
      icon: {
        name: 'icon_copy',
        position: 'left',
      },
    }"
    :setClass="{
      main: '--border-gray-e5 --bg-white --oval --h-30 p:--px-15 tm:--px-8 --text-gray-666',
      text: 'tm:text-[14px] p:text-[16px]',
      icon: 'h-[16px] w-[16px] text-[--gray-999]',
    }"
    @click="onClick"
  />
</template>

<style lang="postcss"></style>
