<script setup>
import '@css/_modules/common/mSvgIcon/common.css'

const runtimeConfig = useRuntimeConfig()
const spriteVersion = useState('svgSpriteVersion', () =>
  String(runtimeConfig.public.appHash || '').trim()
)

const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
})

const spriteHref = computed(() => {
  const baseURL = runtimeConfig.app.baseURL.replace(/\/$/, '')
  const buildAssetsDir = runtimeConfig.app.buildAssetsDir.replace(/^\/*/, '/')
  const rawSpritePath = String(runtimeConfig.public.spritePath || '')
  const spritePath = rawSpritePath.startsWith('/')
    ? rawSpritePath
    : `${buildAssetsDir}${rawSpritePath.replace(/^\/*/, '')}`

  const version = spriteVersion.value ? `?v=${encodeURIComponent(spriteVersion.value)}` : ''

  return `${baseURL}${spritePath}${version}#${props.icon}`
})
</script>

<template>
  <svg class="m-svg-icon">
    <use :href="spriteHref" :xlink:href="spriteHref" />
  </svg>
</template>
