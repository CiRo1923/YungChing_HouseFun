<script setup>
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    buttonText: null,
    ...props.config,
  }
})
</script>

<template>
  <div class="m-accordion --content">
    <div class="m-accordion-body">
      <div class="m-accordion-container overflow-hidden">
        <slot />
      </div>
    </div>
    <footer class="m-accordion-footer">
      <BuyMAnchor :text="config.buttonText" />
    </footer>
  </div>
</template>

<style></style>
