<script setup>
import './.css/variables.css'
import './.css/borderBottomVariables.css'
import './.css/common.css'
import './.css/borderBottom.css'

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
  <header class="m-title --border-bottom" :class="setClass.main">
    <h2 class="m-title-text" :class="setClass.title">
      <strong>{{ props.title }}</strong>
    </h2>
  </header>
</template>
