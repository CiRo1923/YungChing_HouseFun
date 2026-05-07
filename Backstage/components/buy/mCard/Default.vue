<script setup>
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div
    class="m-card --default --bg-white --rounded-15 tm:px-[16px] tm:py-[32px] p:p-[40px]"
    :class="setClass.main"
  >
    <slot />
  </div>
</template>

<style src="@css/_modules/buy/mCard.css"></style>
<style lang="postcss"></style>
