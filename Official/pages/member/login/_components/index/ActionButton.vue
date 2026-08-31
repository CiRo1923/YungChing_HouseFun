<script setup>
const emits = defineEmits(['login'])

const onClick = () => {
  emits('login')
}
</script>

<template>
  <CommonMAnchor
    text="登入"
    :setClass="{
      main: '--oval --bg-orange-f74c --h-55 --text-white --px-30 --text-center w-full',
    }"
    @click="onClick"
  />
</template>
