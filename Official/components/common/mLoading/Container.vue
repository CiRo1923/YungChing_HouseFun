<script setup>
import './.css/variables.css'
import './.css/common.css'

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="m-loading-container" :class="props.setClass?.container">
    <p class="m-loading-text">
      <slot>資料讀取中，感謝您耐心等候！</slot>
    </p>
  </div>
</template>
