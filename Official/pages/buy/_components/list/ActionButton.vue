<script setup>
const emits = defineEmits(['click:clear', 'click:routePush'])

const onClear = () => {
  emits('click:clear')
}

const onRoutePush = () => {
  emits('click:routePush')
}
</script>

<template>
  <ul class="flex gap-x-[10px] px-[30px] py-[15px]">
    <li class="flex-1">
      <BuyMAnchor
        text="清除條件"
        :setClass="{
          main: '--h-45 --oval --border-gray-ccce --text-gray-666 w-full',
        }"
        @click="onClear"
      />
    </li>
    <li class="flex-1">
      <BuyMAnchor
        text="搜尋"
        :setClass="{
          main: '--h-45 --oval --bg-orange-f74c --text-white w-full',
        }"
        @click="onRoutePush"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
