<script setup>
import '@css/_modules/common/mLoading/variables.css'
import '@css/_modules/common/mLoading/common.css'

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
    <!-- --card:浮在遮罩上時要有卡片外觀;直接放在 popup 裡的情境不帶它 -->
    <CommonMLoadingContainer
      :setClass="{
        container: '--card',
      }"
    >
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>
