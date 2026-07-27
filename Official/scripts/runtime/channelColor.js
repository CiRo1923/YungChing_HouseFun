// 掃出所有頻道色票 color{Channel}.css(排除共用 color.css),
// 交給 Vite/PostCSS 處理後取得最終(hash 過)的 URL。
// key 為小寫頻道名,例如 colorBuy.css → 'buy'。
//
// 集中在這裡用 ?url 引用一次:避免同一個 css 檔同時被 glob 與各 layout 直接 import,
// 造成 Vite 產生壞掉的 `?url?inline` id(build 會噴 vue/rollup 解析錯誤)。
const channelColorMap = Object.fromEntries(
  Object.entries(
    import.meta.glob('@css/_common/color*.css', {
      query: '?url',
      import: 'default',
      eager: true,
    })
  )
    .map(([path, href]) => [path.match(/color(\w+)\.css$/)?.[1]?.toLowerCase(), href])
    .filter(([key]) => key)
)

// 依頻道名取得色票 URL,查無回傳 null。
export const getChannelColorHref = (name) => channelColorMap[name] ?? null
