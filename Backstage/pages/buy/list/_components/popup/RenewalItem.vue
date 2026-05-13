<script setup>
import Address from '@pages/buy/_components/Address.vue'

import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const addressData = computed(() => {
  const keyMap = {
    caseAddr: 'address',
    buName: 'community',
  }

  return Object.fromEntries(
    Object.entries(props.data)
      .filter(([key]) => keyMap[key])
      .map(([key, value]) => [keyMap[key], value])
  )
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div :class="setClass.main">
    <p class="text-[16px] tracking-wider">
      <b class="font-medium">{{ props.data.caseTitle }}</b>
    </p>
    <div class="flex items-center">
      <Address
        :data="addressData"
        :setClass="{
          main: 'text-[14px]',
        }"
      />
      <span class="text-[16px] text-[--orange-e646] pt:shrink-0">
        {{ numberComma.add(props.data.casePrice) }} 萬
      </span>
    </div>
  </div>
</template>

<style lang="postcss"></style>
