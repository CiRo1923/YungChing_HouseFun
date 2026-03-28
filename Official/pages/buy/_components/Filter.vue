<script setup>
import Information from '@pages/buy/_components/_Information.vue'
import Mode from '@pages/buy/_components/_Mode.vue'

const emits = defineEmits(['infoClick'])

const onInfoClick = () => {
  emits('infoClick')
}
</script>

<template>
  <div class="pt:flex p:mb-[30px] p:px-[20px]">
    <Information @click="onInfoClick" />
    <Mode />
  </div>
</template>

<style></style>
