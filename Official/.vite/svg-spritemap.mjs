// 取代 @spiriit/vite-plugin-svg-spritemap,把 spritemap 的產生收在自家範疇內。
//
//   _svg/*.svg  →  單一 <svg>,每檔一個 <symbol id="檔名">
//
// 供 components/common/SvgIcon.vue 以 <use xlink:href="…/spritemap.svg#icon_search" /> 引用。
// dev 與 build 共用 createSpritemap,兩邊產出才不會不一致。
//
// ⚠️ 產物需與原套件等價,下列細節是比對其輸出後定出來的,動之前先看懂:
//
//   ① <symbol> 只保留 id 與 viewBox,內容取最佳化後 <svg> 的子節點;
//      沒有 viewBox 的檔案直接跳過(無法決定 <use> 的尺寸)。
//   ② 每個 <symbol> 後面緊跟一個 <use>,width / height 取自 viewBox 的第 3、4 值,
//      y 為前面所有 height 的累加。這些 <use> 只影響「單獨開啟 spritemap.svg 時
//      能不能看到圖」,對 SvgIcon 的 #id 引用沒有作用,保留是為了與原套件等價
//      (對應原套件設定的 use: true / view: false)。
//   ③ 檔案依 localeCompare 排序,確保產物穩定(影響 <use> 的 y 值順序)。
//   ④ SVGO 設定沿用原套件:preset-default 但停用 removeEmptyAttrs /
//      moveGroupAttrsToElems / collapseGroups —— 這三個會破壞 symbol 結構。
//
// ⚠️ 輸出檔名不帶 hash:SvgIcon 以固定路徑加 ?v=appHash 破快取(見 nuxt.config.ts
//    的 runtimeConfig.public.spritePath / spriteVersion)。加上 hash 會讓該路徑失效。

import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { optimize } from 'svgo'

const clientEvent = 'project:svg-spritemap-update'
const spritemapRoute = '/__project_svg_spritemap'

const SVGO_CONFIG = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // 這三個會動到 symbol 的結構或屬性,原套件同樣停用
          removeEmptyAttrs: false,
          moveGroupAttrsToElems: false,
          collapseGroups: false,
        },
      },
    },
  ],
}

// <symbol> 不該沿用的根 <svg> 屬性:
//   id / viewBox 由本函式直接覆寫,width / height 交給後面的 <use>;
//   version / xml:space / x / y 是 <svg> 的文件層級屬性,symbol 上沒有作用。
// 另外 xmlns 系列由外層 <svg> 提供,data-* 是設計工具留下的備註。
// 會影響外觀的(如 overflow="visible")不在此列,一律保留。
//
// ⚠️ 原套件走白名單(svg-element-attributes 的「全域屬性 + svg∩symbol 交集」),
//    這裡改用排除清單,是為了濾個屬性不必再多背一個依賴。
//    與原產物比對:71 個 symbol 只有 icon_image_error 少了 `x="0" y="0"`(共 12 bytes)——
//    那是 SVG 的預設值,且 symbol 被 <use> 引用時位置由 use 決定,不影響渲染。
const SYMBOL_SKIP_ATTRIBUTES = new Set([
  'id',
  'viewbox',
  'width',
  'height',
  'version',
  'xml:space',
  'x',
  'y',
])

const isSkippedSymbolAttribute = (name) => {
  const lower = name.toLowerCase()

  return (
    SYMBOL_SKIP_ATTRIBUTES.has(lower) ||
    lower === 'xmlns' ||
    lower.startsWith('xmlns:') ||
    lower.startsWith('data-')
  )
}

const normalizePath = (path) => path.replace(/\\/g, '/')

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

    // 沒有 viewBox 就無法決定 <use> 尺寸,跳過
    if (!svg || !viewBox) {
      continue
    }

    const id = basename(file, '.svg')
    const symbol = outputDocument.createElement('symbol')

    // 原 <svg> 剩下的屬性要一併帶過來(例:overflow="visible"),否則該圖示的裁切行為會變。
    // ⚠️ 順序照原套件:其餘屬性 → id → viewBox。xmldom 的 setAttribute 對新屬性是往後附加,
    //    先設 viewBox 會讓它排到 id 前面,序列化結果就與原產物不一致。
    Array.from(svg.attributes || []).forEach((attribute) => {
      const { name, value } = attribute

      if (isSkippedSymbolAttribute(name)) return

      symbol.setAttribute(name, value)
    })

    symbol.setAttribute('id', id)
    symbol.setAttribute('viewBox', viewBox)

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

/** dev:以 middleware 即時提供,並在 _svg 變動時通知 client 重載 */
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
        if (!req.url?.startsWith(spritemapRoute)) {
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
 * build:產出實體檔案;fileName 不帶 hash,見檔頭說明。
 *
 * ⚠️ emitFile 的 fileName 是相對於 build.outDir,而 Nuxt 只把 outDir 底下的
 *    assetsDir(`_nuxt/`)搬進 .output/public/。少了這段前綴,檔案會留在
 *    client dist 的頂層而不會出現在產物裡(SvgIcon 取用的路徑是
 *    baseURL + buildAssetsDir + spritePath,見 components/common/SvgIcon.vue)。
 *
 * 只在 client build 產出:server build 那份不會被任何地方取用。
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

export { clientEvent, createSpritemap, spritemapRoute }
