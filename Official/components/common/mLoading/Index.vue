<script setup>
import './.css/variables.css'
import './.css/common.css'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    isFixed: false,
    ...props.config,
  }
})
</script>

<template>
  <div class="m-loading" :class="{ '--fixed': config.isFixed }">
    <CommonMLoadingContainer
      :setClass="{
        container: '--card',
      }"
    >
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>
