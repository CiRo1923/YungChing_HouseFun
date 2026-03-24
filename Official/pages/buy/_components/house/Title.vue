<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <header class="flex items-center gap-x-[5px] tm:mb-[10px] p:mb-[20px]">
    <SvgIcon
      :icon="props.icon"
      class="tmLh-[22px] text-[--green-8b0d] tm:w-[22px] p:h-[30px] p:w-[30px]"
    />
    <h2 class="tm:text-[18px] p:text-[24px]">
      <strong class="font-medium">{{ props.title }}</strong>
    </h2>
  </header>
</template>

<style></style>
