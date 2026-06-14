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
  import.meta.hot.on('project:svg-spritemap-update', () => {
    spritemapVersion.value = Date.now()
  })
}

const spriteHref = computed(() => {
  const baseURL = runtimeConfig.app.baseURL.replace(/\/$/, '')
  const buildAssetsDir = runtimeConfig.app.buildAssetsDir.replace(/^\/*/, '/')
  const spritePath = String(runtimeConfig.public.spritePath || '').replace(/^\/*/, '')
  // dev 的 sprite 是掛在 server 根路徑的 middleware，不在 buildAssetsDir 底下，
  // 只有 production 的 spritemap.svg 才放在 _nuxt/ 下。
  const spriteBase = import.meta.dev
    ? `${baseURL}/${spritePath}`
    : `${baseURL}${buildAssetsDir}${spritePath}`
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
