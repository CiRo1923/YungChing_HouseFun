<script setup>
const runtimeConfig = useRuntimeConfig()

const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
})

const spriteHref = computed(() => {
  const baseURL = runtimeConfig.app.baseURL.replace(/\/$/, '')
  const buildAssetsDir = runtimeConfig.app.buildAssetsDir.replace(/^\/*/, '/')
  const spritePath = String(runtimeConfig.public.spritePath || '').replace(/^\/*/, '')
  const spriteBase = `${baseURL}${buildAssetsDir}${spritePath}`

  return `${spriteBase}#${props.icon}`
})
</script>

<template>
  <svg class="fill-current">
    <use :href="spriteHref" />
  </svg>
</template>

<style lang="postcss"></style>
