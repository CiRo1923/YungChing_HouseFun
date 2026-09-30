<script setup>
import './.css/variables.css'
import './.css/filterVariables.css'
import './.css/common.css'
import './.css/filter.css'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

// 標題字級由使用端傳 —— module 不設 text-*,否則會蓋掉這裡傳進來的
const setClass = computed(() => {
  return {
    title: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-card --filter --bg-white --rounded-15">
    <header class="m-card-filter-header">
      <h3 class="m-card-filter-title" :class="setClass.title">
        <strong>{{ props.title }}</strong>
      </h3>
      <div class="m-card-filter-tools" v-if="$slots.tools">
        <slot name="tools" />
      </div>
    </header>
    <div class="m-card-filter-body">
      <slot />
    </div>
  </div>
</template>
