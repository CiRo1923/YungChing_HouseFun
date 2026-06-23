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
    button: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div :class="setClass.main">
    <button type="button" class="inline-block" :class="setClass.button">
      <CommonSvgIcon icon="icon_love_o" class="h-[30px] w-[30px] p-[3px]" />
    </button>
  </div>
</template>

<style lang="postcss"></style>
