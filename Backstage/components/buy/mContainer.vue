<script setup>
import '@css/_modules/buy/mContainer/variables.css'
import '@css/_modules/buy/mContainer/common.css'

const route = useRoute()
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    headerTools: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-container" :class="setClass.main">
    <header class="m-container-header">
      <h2 class="m-container-title">
        <strong>{{ route.meta.title }}</strong>
      </h2>
      <div
        class="m-container-header-tools"
        :class="setClass.headerTools"
        v-if="$slots.header_tools"
      >
        <slot name="header_tools" />
      </div>
    </header>
    <div class="m-container-body">
      <div class="m-container-tools" v-if="$slots.tools">
        <slot name="tools" />
      </div>
      <div class="m-container-content">
        <slot />
      </div>
    </div>
  </div>
</template>
