<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  // config: {
  //   type: Object,
  //   default: () => ({}),
  // },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

// const config = computed(() => {
//   return {
//     icon: null,
//     imgSrc: null,
//     ...props.config,
//   }
// })

const setClass = computed(() => {
  return {
    main: '',
    // icon: '',
    title: '',
    ...props.setClass,
  }
})
</script>

<template>
  <header
    class="m-title --border-bottom relative flex items-center gap-x-[5px]"
    :class="setClass.main"
  >
    <h2 class="m-title-text tm:text-[18px] p:text-[24px]" :class="setClass.title">
      <strong class="font-medium">{{ props.title }}</strong>
    </h2>
  </header>
</template>

<style lang="postcss">
.m-title {
  &.\-\-border-bottom {
    .m-title-text {
      &:after {
        @apply block h-[5px] w-full rounded-full bg-[--green-8b0d] content-default;
      }
    }
  }
}
</style>
