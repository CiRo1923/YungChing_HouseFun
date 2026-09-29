<script setup>
/* 顯示圖示。

  圖示不是一張張獨立的圖檔:建置流程會把 _svg 資料夾裡的圖形合併成一份共用檔案,
  這支元件依名稱從裡面取出其中一個。傳入的 icon 名稱對應 _svg 裡的檔名（不含副檔名)。

  尺寸與顏色由使用端的樣式決定,元件本身不設定,
  所以同一個圖示可以在不同地方用不同大小呈現。

  圖示網址會帶一段版本號。共用檔案的檔名固定不變,
  沒有版本號時瀏覽器會繼續使用先前快取的舊版本,新增的圖示會顯示不出來。
  版本號取自建置識別碼,內容有更新時網址才會跟著變。 */

import './.css/common.css'

/* 產生 sprite 的那支建置外掛在每次更新後會送一個事件過來,名字是這個。

  兩邊各寫一份是不得已的:那支外掛在建置期跑,它用到的東西(svg 最佳化、
  xml 解析)不能進瀏覽器,所以這裡沒有辦法 import 它的那一份。
  改名字的時候兩邊要一起改 —— 只改一邊的話這裡永遠收不到,
  而開發時又會回到「新增的圖示顯示不出來」那個狀態。 */
const SPRITE_UPDATED = 'project:svg-spritemap-update'

const runtimeConfig = useRuntimeConfig()

/* 開發時不能拿建置識別碼當版本號 —— 它在整個開發過程中都不會變,
  而圖示是隨時在增減的:新增一支之後網址沒變,瀏覽器就繼續用快取裡的舊 sprite,
  那支圖示顯示不出來,而且畫面上看不出原因(不報錯,只是那個位置空著)。 */
const spriteVersion = useState('svgSpriteVersion', () =>
  import.meta.env.DEV ? String(Date.now()) : String(runtimeConfig.public.appHash || '').trim()
)

/* 收到更新就換版本號,網址跟著變,瀏覽器才會去拿新的那一份。
   只在開發伺服器底下成立(正式站沒有這個通道),所以要先確認它在。 */
if (import.meta.hot) {
  import.meta.hot.on(SPRITE_UPDATED, (data) => {
    spriteVersion.value = String(data?.version ?? Date.now())
  })
}

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
