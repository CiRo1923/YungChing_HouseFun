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
    <CommonMLoadingContainer
      :setClass="{
        container: 'rounded-[15px] bg-[--white] py-[30px] tm:p-[32px] p:px-[72px]',
      }"
    >
      <slot />
    </CommonMLoadingContainer>
  </div>
</template>
