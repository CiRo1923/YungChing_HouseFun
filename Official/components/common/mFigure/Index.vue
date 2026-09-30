<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   assets/imgs/common/blank.svg
     載入中的佔位圖,而且圖片索引的前綴是從它反推的(見下面那段)。
   assets/imgs/common/no_image.svg
     找不到圖時顯示的那一張。
   少了任何一支,這支元件編譯不過(Could not load …)。 */

import './.css/variables.css'
import './.css/common.css'
import './.css/styleProject.css'

import blankUrl from '@imgs/common/blank.svg'
import noImageUrl from '@imgs/common/no_image.svg'

const runtimeConfig = useRuntimeConfig()

/* 圖片索引 —— 打包工具把圖片目錄底下的每一支都收進來。

  路徑用 alias,不寫死目錄名:寫死的話,換一個圖片目錄叫別的名字的專案,
  glob 會回一個空物件 —— 不報錯,畫面上每一張圖都找不到,而程式看起來完全正常。 */
const MAP = import.meta.glob('@imgs/**/*', { eager: true, import: 'default' })

/* glob 的 key 是 alias 解析後的絕對路徑,前綴隨專案的目錄擺法不同。

  前綴從 blank.svg 反推,不必知道圖片目錄叫什麼 ——
  那一支是這支元件本來就相依的檔案(上面 import 了它,少了它編譯不過),
  所以它一定在 glob 的結果裡。找出它的 key、砍掉後面那一段,
  剩下的就是所有 key 共同的前綴。 */
const KNOWN_IMG = 'common/blank.svg'

const IMG_PREFIX =
  Object.keys(MAP)
    .find((key) => key.endsWith(`/${KNOWN_IMG}`))
    ?.slice(0, -KNOWN_IMG.length) ?? ''

// 呼叫端傳的是相對圖片目錄的路徑(common/blank.svg),轉成 glob 的 key
const toKey = (p) => `${IMG_PREFIX}${String(p).replace(/^\/+/, '')}`

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

  /* 找不到就要講出是哪一個路徑、該放在哪裡。

    **要找是誰傳了這個值,搜訊息裡那個原始路徑**(下面的 raw)——
    那是使用端自己寫的字串,全案搜得到。

    前面那個方括號只是讓人一眼認出是哪一組元件發的訊息,不是拿來搜使用端的:
    使用端寫的是自動註冊的標籤名,而那個名字由元件在專案裡的擺法決定
    (多包一層分類資料夾,名字就多一段),同一支元件在各專案叫不同名字。

    解析後的那個 key 也不印 —— 那串是這個專案的目錄擺法算出來的絕對路徑,
    使用端手上沒有那個東西。 */
  if (import.meta.env.DEV) {
    console.warn(
      `[mFigure] 找不到圖片 ${raw} —— 這支元件只認打包進來的圖,` +
        `路徑相對圖片目錄寫(這個專案解析到 ${IMG_PREFIX || '空字串:glob 一個檔案都沒對到'})。` +
        `外部圖片要寫完整的 http(s):// 或 data:。`
    )
  }

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

  <div class="m-figure --error" :class="setClass.main" v-else>
    <div class="m-figure-error">
      <CommonMSvgIcon class="m-figure-error-icon" icon="icon_image_error" />
    </div>
  </div>
</template>
