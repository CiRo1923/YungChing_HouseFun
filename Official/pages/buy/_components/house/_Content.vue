<script setup>
import Content from '@components/common/mContent.vue'

import Title from '@pages/buy/_components/house/_Title.vue'

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
    title: null,
    ...props.setClass,
  }
})
</script>

<template>
  <Content class="pt:--rounded-20 p:--px-40 p:--py-30" :class="setClass.main">
    <Title :title="props.title" :config="config" :setClass="setClass.title" />
    <div class="p:mt-[20px]" v-if="$slots.default">
      <slot />
    </div>
  </Content>
</template>

<style></style>
