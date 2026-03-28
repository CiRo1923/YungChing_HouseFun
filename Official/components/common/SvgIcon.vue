<script setup>
const runtimeConfig = useRuntimeConfig()

const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
})

const spritemapVersion = useState('spritemap-version', () => Date.now())
const spritemapHmrBound = useState('spritemap-hmr-bound', () => false)

if (import.meta.client && import.meta.hot && !spritemapHmrBound.value) {
  spritemapHmrBound.value = true
  import.meta.hot.on('vite-plugin-svg-spritemap:update', () => {
    spritemapVersion.value = Date.now()
  })
}

const spriteHref = computed(() => {
  const baseURL = runtimeConfig.app.baseURL.replace(/\/$/, '')
  const buildAssetsDir = runtimeConfig.app.buildAssetsDir.replace(/^\/*/, '/')
  const spritePath = String(runtimeConfig.public.spritePath || '').replace(/^\/*/, '')
  const spriteBase = `${baseURL}${buildAssetsDir}${spritePath}`
  const prodVersion = String(runtimeConfig.public.spriteVersion || '').trim()
  const version = import.meta.dev ? String(spritemapVersion.value) : prodVersion
  const spriteURL = version ? `${spriteBase}?v=${encodeURIComponent(version)}` : spriteBase

  return `${spriteURL}#${props.icon}`
})
</script>

<template>
  <svg class="fill-current">
    <use :href="spriteHref" />
  </svg>
</template>

<style lang="postcss"></style>
