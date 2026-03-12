<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'

import { hashHex } from '@js/_crypto.js'

import blankUrl from '@imgs/common/blank.svg'

// 用字面字串，固定抓 assets/imgs
const MAP = import.meta.glob('/assets/imgs/**/*', { eager: true, import: 'default' })

// 將相對檔名轉成 glob key
const toKey = (p) => `/assets/imgs/${String(p).replace(/^\/+/, '')}`

// 依照你的需求：回傳 URL + ?[hash]（用 VITE_APP_HASH）
const bust = (url) => `${url}?${hashHex(import.meta.env.VITE_APP_HASH, 8)}`

const resolveBundledImg = (raw) => {
  if (!raw) return null

  // 外部/特殊
  if (/^(https?:|data:|blob:)/.test(raw)) {
    if (/^http/.test(raw)) {
      const imgName = /\/([^/?#]+)(?:\?|$)/.exec(raw)[0]
      const hasQuery = /\?/.test(raw)
      return `${encodeURI(raw)}${hasQuery ? '&' : '?'}${hashHex(imgName, 8)}`
    }
    return encodeURI(raw)
  }

  // 本地：用 glob 對映
  const hit = MAP[toKey(raw)]
  if (hit) return bust(hit)

  console.warn('[ImgSrc] not found:', toKey(raw))
  return blankUrl // 找不到就用佔位圖
}

// ---- props & 狀態 ----
const props = defineProps({
  src: {
    type: [String, Object],
    default: null,
    required: true,
  },
  alt: {
    type: String,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const imageRef = ref(null)
const status = ref(200)
const config = computed(() => {
  return {
    lazy: true,
    ...props.config,
  }
})
const as = computed(() => (status.value === 200 ? 'figure' : 'div'))
const hasLazy = computed(() => config.value.lazy)
const hasMobile = computed(() =>
  props.src && typeof props.src === 'object' ? true : !!/[?&#]m=[^?&#]*/.test(props.src)
)

// ---- 路徑 ----
const mobilePath = computed(() => {
  const src =
    props.src && typeof props.src === 'object' && props.src.m
      ? props.src.m
      : props.src && hasMobile.value
        ? `${/.*(?=\?.*$)/.exec(props.src)[0].replace(/.(\w+$)/, '_m.$1')}`
        : null
  return resolveBundledImg(src)
})

const path = computed(() => {
  const src =
    props.src && typeof props.src === 'object'
      ? props.src.p
      : props.src && hasMobile.value
        ? /.*(?=\?.*$)/.exec(props.src)[0]
        : props.src
  return resolveBundledImg(src)
})

const setClass = computed(() => ({ main: '', img: '', ...props.setClass }))

// ---- lazy ----
const onEnterView = (entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const image = entry.target
      if (path.value) image.setAttribute('src', path.value)
      observer.unobserve(image)
    }
  }
}

const onLazy = () => {
  if (hasLazy.value && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(onEnterView)
    const el = imageRef.value
    if (el) imageObserver.observe(el)
  }
}

watch(path, (newValue) => {
  if (imageRef.value) imageRef.value.setAttribute('src', newValue || blankUrl)
})

const onError = () => {
  status.value = 404
}
onMounted(() => onLazy())
</script>

<template>
  <component :is="as" class="m-figure" :class="setClass.main" v-if="status === 200">
    <picture v-if="mobilePath && hasMobile">
      <source :srcset="mobilePath" media="(max-width: 428px)" />
      <img
        :src="blankUrl"
        width="100%"
        height="100%"
        :loading="hasLazy ? 'lazy' : null"
        ref="imageRef"
        :alt="props.alt"
        :class="setClass.img"
        @error="onError"
      />
    </picture>
    <img
      :src="blankUrl"
      width="100%"
      height="100%"
      :loading="hasLazy ? 'lazy' : null"
      ref="imageRef"
      :alt="props.alt"
      :class="setClass.img"
      @error="onError"
      v-else
    />
  </component>

  <div class="m-figure" :class="setClass.main" v-else>
    <div class="m-figure-error flex items-center justify-center">
      <SvgIcon class="m:h-[36px] m:w-[36px] pt:h-[54px] pt:w-[54px]" icon="image_404" />
    </div>
  </div>
</template>

<style lang="postcss"></style>
