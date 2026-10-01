// 取代 @spiriit/vite-plugin-svg-spritemap，把 spritemap 的產生收在自家範疇內。
//
//   _svg/*.svg  →  單一 <svg>，每檔一個 <symbol id="檔名">
//
// 供 components/mSvgIcon/Index.vue 以 <use href="…/spritemap.svg#icon_search" /> 引用。
// dev 與 build 共用同一組合成邏輯（createSpritemap），避免兩邊產出不一致。
//
// 注意：產物需與原套件等價，下列細節是比對其輸出後定出來的，動之前先看懂：
//
//   ① <symbol> 帶 id、viewBox 與原 <svg> 的其餘屬性，內容取最佳化後 <svg> 的子節點；
//      沒有 viewBox 的檔案直接跳過（無法決定 <use> 的尺寸）。
//      其餘屬性要帶：像 overflow="visible" 這種決定「超出 viewBox 的筆畫要不要顯示」
//      的設定寫在根節點上，丟掉之後那幾支圖示會被裁掉一塊，而且不會報錯。
//      不帶的只有四個，見 SYMBOL_SKIPPED_ATTRS。
//   ② 每個 <symbol> 後面緊跟一個 <use>，width / height 取自 viewBox 的第 3、4 值，
//      y 為前面所有 height 的累加。這些 <use> 只影響「單獨開啟 spritemap.svg 時
//      能不能看到圖」，對 MSvgIcon 的 #id 引用沒有作用，保留是為了與原套件等價。
//   ③ 檔案依 localeCompare 排序，確保產物穩定（影響 <use> 的 y 值順序）。
//   ④ SVGO 設定沿用原套件：preset-default 但停用 removeEmptyAttrs /
//      moveGroupAttrsToElems / collapseGroups —— 這三個會破壞 symbol 結構。
//      原套件把 svgo 列為 optional peer，本專案已安裝，故行為一致。
//
// 注意：輸出檔名不帶 hash：MSvgIcon 以固定路徑加 ?v=appHash 破快取（見 nuxt.config.ts
//    的 runtimeConfig.public.spritePath）。加上 hash 會讓該路徑失效。
//
// 接到新專案：先裝這兩個套件（開發相依即可）——
//
//      npm i -D @xmldom/xmldom svgo
//
//    這支檔案直接 import 它們（見下方的 import）。**從別的圖示合成套件換過來的
//    專案特別容易漏掉**：那兩個原本是舊套件的間接相依，移除舊套件的那一刻才消失，
//    而建置的訊息只說「找不到某個模組」，不會提到是圖示合成需要它 ——
//    那時剛改完接線，看起來像是接錯了。
//
//    然後在 nuxt.config.ts 裡掛上兩支外掛（dev / build），並把
//    runtimeConfig.public.spritePath 設成 spritePathOf(是不是開發模式, CONFIG.imgs)，
//    再確認元件 mSvgIcon/Index.vue 跟著來源走 —— 部署前綴與資產目錄由它接。
//
//    這一層（.vite/）跟著來源同步，框架設定不跟 —— 所以組路徑這類會改的東西
//    都收在這支檔案裡，那邊只剩接線。

import { existsSync, readdirSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { optimize } from 'svgo'

const clientEvent = 'project:svg-spritemap-update'

/* 開發時那一份掛在框架的資產目錄底下(`/_nuxt/`),不是網站根 ——
   放在根層會撞到框架自己的路由。名字與路由分開寫是因為元件那邊只要名字:
   資產目錄那一段由它從框架的執行期設定接回去(見 mSvgIcon/Index.vue)。 */
const spritemapName = 'svg-spritemap'
const spritemapRoute = `/_nuxt/${spritemapName}`

/* 認得帶與不帶部署前綴的兩種寫法。

   這支 middleware 掛在開發伺服器自己那幾層之前,看到的網址還沒被去掉前綴 ——
   站台掛在子目錄時(設定的 baseURL),請求進來是 `/子目錄/_nuxt/svg-spritemap`,
   用開頭比對就對不上,而那個請求最後拿到的是首頁的 HTML;
   瀏覽器拿它當 svg 解析,畫面上只是圖示全部不見,沒有任何錯誤訊息。 */
export const isSpritemapRequest = (url) => (url || '').split('?')[0].endsWith(spritemapRoute)

const SVGO_CONFIG = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // 這三個會動到 symbol 的結構或屬性，原套件同樣停用
          removeEmptyAttrs: false,
          moveGroupAttrsToElems: false,
          collapseGroups: false,
        },
      },
    },
  ],
}

const normalizePath = (path) => path.replaceAll('\\', '/')

const isSvgFileInDir = (file, svgDir) => {
  const normalizedFile = normalizePath(file)
  const normalizedSvgDir = normalizePath(svgDir)

  return normalizedFile.startsWith(`${normalizedSvgDir}/`) && normalizedFile.endsWith('.svg')
}

/** viewBox="0 0 24 24" → { width: '24', height: '24' } */
const sizeFromViewBox = (viewBox) => {
  const parts = String(viewBox)
    .trim()
    .split(/[\s,]+/)

  return { width: parts[2], height: parts[3] }
}

/* 這幾個不跟著原 <svg> 走 —— 每一項擋的都是「會動到畫面或只是多餘」的東西:

     id / viewBox      由這支外掛自己給(檔名、量過的值)
     width / height    帶進 <symbol> 會綁死尺寸,而尺寸是由使用端的樣式決定的
     x / y             SVG2 的 <symbol> 認得這兩個,帶進去會位移 <use> 畫出來的位置。
                       原檔那兩個值講的是「它在自己那張畫布上的位置」,搬過來沒有意義,
                       而位移是一點一點的 —— 看起來像圖示沒對齊,不像屬性帶錯
     version           SVG 1.1 的文件版本宣告,放在 <symbol> 上沒有作用
     xml:space         文件層級的空白處理方式,放在 <symbol> 上沒有作用
     data-*            原檔留給設計工具的標記(圖層名、匯出設定),
                       整批複製進產物 —— 每一支圖示都帶一份,而沒有人讀它們

   命名空間宣告(xmlns…)也不帶 —— 那是根節點的事,合出來的那一份已經有了。

   **其餘的一律要帶**:寫在根節點上的呈現設定(最常見的是 overflow="visible",
   讓超出 viewBox 的筆畫照樣畫出來)丟掉之後,那幾支圖示會被裁掉一塊,而且不報錯。 */
const SYMBOL_SKIPPED_ATTRS = new Set([
  'id',
  'viewBox',
  'viewbox',
  'width',
  'height',
  'x',
  'y',
  'version',
  'xml:space',
])

/* 開頭就認得出來的那幾類 —— 名字不固定,只能比前綴。 */
const SYMBOL_SKIPPED_PREFIXES = ['xmlns', 'data-']

/**
 * 把原 <svg> 的其餘屬性搬到 <symbol> 上。
 *
 * 少了這一段,寫在根節點上的呈現設定會整批消失 —— 最常見的是
 * overflow="visible"(讓超出 viewBox 的筆畫照樣畫出來),
 * 丟掉之後那幾支圖示會被裁掉一塊,而畫面上只是「圖示看起來少一塊」,
 * 不會有任何錯誤訊息。
 */
const onCopyRootAttributes = (svg, symbol) => {
  Array.from(svg.attributes || []).forEach(({ name, value }) => {
    if (SYMBOL_SKIPPED_ATTRS.has(name)) return
    if (SYMBOL_SKIPPED_PREFIXES.some((prefix) => name.startsWith(prefix))) return

    symbol.setAttribute(name, value)
  })
}

const createSpritemap = async (svgDir) => {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()
  const outputDocument = new DOMImplementation().createDocument(null, '', null)
  const spritemap = outputDocument.createElement('svg')

  spritemap.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  spritemap.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  const files = (await readdir(svgDir, { withFileTypes: true }))
    .filter((item) => item.isFile() && item.name.endsWith('.svg'))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b))

  let offsetY = 0

  for (const file of files) {
    const filePath = resolve(svgDir, file)
    const source = await readFile(filePath, 'utf8')
    const { data } = optimize(source, { ...SVGO_CONFIG, path: filePath })
    const document = parser.parseFromString(data, 'image/svg+xml')
    const svg = document.documentElement
    const viewBox = svg?.getAttribute('viewBox') || svg?.getAttribute('viewbox')

    // 沒有 viewBox 就無法決定 <use> 尺寸，跳過
    if (!svg || !viewBox) {
      continue
    }

    const id = basename(file, '.svg')
    const symbol = outputDocument.createElement('symbol')

    symbol.setAttribute('id', id)
    symbol.setAttribute('viewBox', viewBox)
    onCopyRootAttributes(svg, symbol)

    Array.from(svg.childNodes).forEach((child) => {
      symbol.appendChild(child.cloneNode(true))
    })

    spritemap.appendChild(symbol)

    const { width, height } = sizeFromViewBox(viewBox)
    const use = outputDocument.createElement('use')

    use.setAttribute('xlink:href', `#${id}`)
    use.setAttribute('width', width)
    use.setAttribute('height', height)
    use.setAttribute('y', String(offsetY))

    spritemap.appendChild(use)
    offsetY += Number(height) || 0
  }

  return serializer.serializeToString(spritemap)
}

/** dev：以 middleware 即時提供，並在 _svg 變動時通知 client 重載 */
export default function SvgSpritemapDevPlugin(svgDirName = '_svg') {
  let svgDir = ''
  let spritemap = ''

  return {
    name: 'project-svg-spritemap-dev',
    apply: 'serve',
    configResolved(config) {
      svgDir = resolve(config.root, svgDirName)
    },
    async buildStart() {
      spritemap = await createSpritemap(svgDir)
    },
    configureServer(server) {
      server.watcher.add(resolve(svgDir, '*.svg'))

      server.middlewares.use(async (req, res, next) => {
        if (!isSpritemapRequest(req.url)) {
          next()
          return
        }

        spritemap = await createSpritemap(svgDir)
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'no-store')
        res.end(spritemap)
      })

      const updateSpritemap = async (file) => {
        if (!isSvgFileInDir(file, svgDir)) {
          return
        }

        spritemap = await createSpritemap(svgDir)
        server.ws.send({
          type: 'custom',
          event: clientEvent,
          data: { version: Date.now() },
        })
      }

      server.watcher.on('add', updateSpritemap)
      server.watcher.on('change', updateSpritemap)
      server.watcher.on('unlink', updateSpritemap)
    },
  }
}

/**
 * build：產出實體檔案；fileName 不帶 hash，見檔頭說明。
 *
 * 注意：emitFile 的 fileName 是相對於 build.outDir，而 Nuxt 只把 outDir 底下的
 *    assetsDir（`_nuxt/`）搬進 .output/public/。少了這段前綴，檔案會留在
 *    client dist 的頂層 assets/ 而不會出現在產物裡（MSvgIcon 取用的路徑是
 *    baseURL + buildAssetsDir + spritePath，見 components/mSvgIcon/Index.vue）。
 *
 * 只在 client build 產出：server build 那份不會被任何地方取用。
 */
export function SvgSpritemapBuildPlugin(svgDirName = '_svg', fileName = 'spritemap.svg') {
  let svgDir = ''
  let assetsDir = ''
  let isSsr = false

  return {
    name: 'project-svg-spritemap-build',
    apply: 'build',
    configResolved(config) {
      svgDir = resolve(config.root, svgDirName)
      assetsDir = String(config.build?.assetsDir ?? '').replace(/^\/+|\/+$/g, '')
      isSsr = Boolean(config.build?.ssr)
    },
    async generateBundle() {
      if (isSsr) return

      const source = await createSpritemap(svgDir)

      this.emitFile({
        type: 'asset',
        fileName: assetsDir ? `${assetsDir}/${fileName}` : fileName,
        source,
      })
    },
  }
}

/**
 * 元件要去哪裡拿那一份 —— 開發時是下面的 middleware 即時合成的那個路由,
 * 建置後是實體檔案。
 *
 * **收在這一支,不寫在框架設定裡。** 框架設定每個專案都不一樣(請求轉發、
 * 部署路徑、產物擺法),它不跟著來源走;這一行攤在那裡的話,
 * 這邊改過路徑規則之後到不了任何一個專案,而且不會有人發現 ——
 * 表現出來只是某個專案的圖示行為與其他專案不同。
 *
 * 回傳的是「不帶部署前綴」的路徑:前綴與資產目錄由元件用框架的執行期設定接上
 * (見 components/mSvgIcon/Index.vue)—— 那兩個值只有執行期拿得到。
 *
 * @param isDevelopment 開發模式
 * @param imgsDir       圖片資產的資料夾名,相對產物根
 */
export const spritePathOf = (isDevelopment, imgsDir) =>
  isDevelopment ? spritemapName : `${imgsDir}/svg/spritemap.svg`

/**
 * 這個專案有哪幾支圖示 —— 元件拿它檢查「引用的名字在不在」。
 *
 * 名字打錯或引用了別的專案才有的那一支時,`<use>` 找不到對應的 symbol,
 * 畫面上那個位置就是空的 —— **不會報錯**,而且從畫面上看不出是名字的問題
 * (看起來像那個圖示本來就沒做)。有了這份名單,元件可以在開發時當場講出來。
 *
 * 目錄不存在時回空陣列 —— 那時元件不檢查,而不是把每一個名字都報成不存在。
 */
export const listSpritemapIcons = (svgDir) => {
  if (!existsSync(svgDir)) return []

  return readdirSync(svgDir)
    .filter((one) => /\.svg$/i.test(one))
    .map((one) => one.replace(/\.svg$/i, ''))
    .sort()
}

export { clientEvent, createSpritemap, spritemapRoute }
