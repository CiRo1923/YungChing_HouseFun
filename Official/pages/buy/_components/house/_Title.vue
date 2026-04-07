<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ImgSrc from '@components/common/ImgSrc.vue'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    icon: null,
    imgSrc: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    icon: '',
    title: '',
    ...props.setClass,
  }
})
</script>

<template>
  <header class="flex items-center gap-x-[5px]" :class="setClass.main">
    <span
      class="tm:h-[22px] tm:w-[22px] p:h-[30px] p:w-[30px]"
      :class="setClass.icon"
      v-if="config.icon || config.imgSrc || $slots.icon"
    >
      <slot name="icon">
        <SvgIcon :icon="config.icon" class="h-full w-full text-[--green-8b0d]" v-if="config.icon" />
        <imgSrc
          :src="config.imgSrc"
          :setClass="{
            main: 'h-full w-full',
          }"
          v-if="config.imgSrc"
        />
      </slot>
    </span>
    <h2 class="tm:text-[18px] p:text-[24px]" :class="setClass.title">
      <strong class="font-medium">{{ props.title }}</strong>
    </h2>
  </header>
</template>

<style></style>
