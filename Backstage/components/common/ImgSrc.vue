<script setup>
import blankUrl from '@imgs/common/blank.svg'
import noImageUrl from '@imgs/common/no_image.svg'

const runtimeConfig = useRuntimeConfig()

// 用字面字串，固定抓 assets/imgs
const MAP = import.meta.glob('/assets/imgs/**/*', { eager: true, import: 'default' })

// 將相對檔名轉成 glob key
const toKey = (p) => `/assets/imgs/${String(p).replace(/^\/+/, '')}`

// 依照需求：回傳 URL + ?[hash]（用 VITE_APP_HASH）
const bust = (url) => `${url}?${runtimeConfig.public.appHash}`

const resolveBundledImg = (raw) => {
  if (!raw) return null

  // 外部/特殊
  if (/^(https?:|data:|blob:)/.test(raw)) {
    return encodeURI(raw)
  }

  // 本地：用 glob 對映
  const hit = MAP[toKey(raw)]
  if (hit) return bust(hit)

  console.warn('[ImgSrc] not found:', toKey(raw))
  return encodeURI(raw)
}

// ---- props & 狀態 ----
const props = defineProps({
  src: {
    type: [String, Object],
    default: null,
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
const as = computed(() => 'figure')
const hasLazy = computed(() => config.value.lazy)
const hasNoImage = computed(() => {
  if (!props.src) return true
  if (typeof props.src === 'object') return !props.src.p && !props.src.m
  return false
})
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
  if (hasNoImage.value) return noImageUrl

  const src =
    props.src && typeof props.src === 'object'
      ? props.src.p
      : props.src && hasMobile.value
        ? /.*(?=\?.*$)/.exec(props.src)[0]
        : props.src
  return resolveBundledImg(src)
})

const setClass = computed(() => ({ main: '', img: '', ...props.setClass }))
const initialSrc = computed(() => (hasNoImage.value ? noImageUrl : blankUrl))

// ---- lazy ----
const setImageSrc = () => {
  if (imageRef.value && path.value) imageRef.value.setAttribute('src', path.value)
}

const isInViewport = () => {
  if (!imageRef.value) return false
  const rect = imageRef.value.getBoundingClientRect()
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  )
}

const onEnterView = (entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      setImageSrc()
      observer.unobserve(entry.target)
    }
  }
}

const onLazy = () => {
  if (!hasLazy.value || !('IntersectionObserver' in window)) {
    setImageSrc()
    return
  }

  if (hasLazy.value && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(onEnterView)
    const el = imageRef.value
    if (el) imageObserver.observe(el)
  }
}

watch(path, (newValue) => {
  status.value = 200
  if (imageRef.value) imageRef.value.setAttribute('src', newValue || initialSrc.value)
})

const onError = () => {
  status.value = 404
}
onMounted(() => {
  onLazy()
  requestAnimationFrame(() => {
    if (isInViewport()) setImageSrc()
  })
})
</script>

<template>
  <component
    :is="as"
    class="m-figure"
    :class="[setClass.main, { '--no-image': hasNoImage }]"
    v-if="status === 200"
  >
    <picture v-if="mobilePath && hasMobile">
      <source :srcset="mobilePath" media="(max-width: 428px)" />
      <img
        :src="initialSrc"
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
      :src="initialSrc"
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

  <div
    class="m-figure flex items-center justify-center rounded-[10px] border-[1px] border-[--gray-e5]"
    :class="setClass.main"
    v-else
  >
    <div class="m-figure-error flex items-center justify-center">
      <CommonSvgIcon
        class="h-[30%] max-h-[120px] w-[30%] max-w-[120px] text-[--gray-999]"
        icon="icon_image_error"
      />
    </div>
  </div>
</template>

<style lang="postcss">
.m-figure {
  &.\-\-no-image {
    @apply flex items-center justify-center bg-[--gray-f2];

    img {
      @apply h-[auto] w-[50%] max-w-[250px];
    }
  }
}
</style>
