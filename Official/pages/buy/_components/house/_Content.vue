<script setup>
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
  <CommonMContent
    class="pt:--rounded-20 p:--px-40 p:--py-30 tm:--rounded-10 tm:--p-15 m:mx-[10px]"
    :class="setClass.main"
  >
    <Title :title="props.title" :config="config" :setClass="setClass.title" />
    <div class="tm:mt-[10px] p:mt-[20px]" v-if="$slots.default">
      <slot />
    </div>
  </CommonMContent>
</template>

<style></style>
