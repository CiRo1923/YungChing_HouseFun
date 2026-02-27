<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="m-card --default --bg-white --rounded-15 tm:px-[16px] tm:py-[32px] p:p-[40px]">
    <slot />
  </div>
</template>

<style src="@css/_modules/buy/mCard.css"></style>
<style lang="postcss"></style>
