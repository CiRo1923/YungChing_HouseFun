<script setup>
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
    as: 'h2',
    description: null,
    image: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    header: '',
    description: '',
    image: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="flex flex-row-reverse items-center gap-x-[10px]" :class="setClass.main">
    <div class="tm:space-y-[5px] p:space-y-[10px]" :class="setClass.container">
      <header :class="setClass.header">
        <component :is="config.as" class="tm:text-[24px] p:text-[30px]">
          <strong class="font-medium">{{ props.title }}</strong>
        </component>
        <p
          class="tm:text-[16px] p:text-[18px]"
          :class="setClass.description"
          v-if="config.description"
        >
          {{ config.description }}
        </p>
      </header>
      <slot />
    </div>
    <CommonImgSrc
      :src="config.image"
      alt=""
      :setClass="{
        main: 'h-[68px] w-[90px] shrink-0',
        ...setClass.image,
      }"
      v-if="config.image"
    />
  </div>
</template>

<style lang="postcss"></style>
