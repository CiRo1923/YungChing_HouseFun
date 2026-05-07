import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { DOMImplementation, DOMParser, XMLSerializer } from '@xmldom/xmldom'

const clientEvent = 'housefun:svg-spritemap-update'
const spritemapRoute = '/__housefun_svg_spritemap'

const normalizePath = (path) => path.replace(/\\/g, '/')

const isSvgFileInDir = (file, svgDir) => {
  const normalizedFile = normalizePath(file)
  const normalizedSvgDir = normalizePath(svgDir)

  return normalizedFile.startsWith(`${normalizedSvgDir}/`) && normalizedFile.endsWith('.svg')
}

const createSpritemap = async (svgDir) => {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()
  const outputDocument = new DOMImplementation().createDocument(null, '', null)
  const spritemap = outputDocument.createElement('svg')

  spritemap.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const files = (await readdir(svgDir, { withFileTypes: true }))
    .filter((item) => item.isFile() && item.name.endsWith('.svg'))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b))

  for (const file of files) {
    const filePath = resolve(svgDir, file)
    const source = await readFile(filePath, 'utf8')
    const document = parser.parseFromString(source, 'image/svg+xml')
    const svg = document.documentElement
    const viewBox = svg?.getAttribute('viewBox') || svg?.getAttribute('viewbox')

    if (!svg || !viewBox) {
      continue
    }

    const symbol = outputDocument.createElement('symbol')
    symbol.setAttribute('id', basename(file, '.svg'))
    symbol.setAttribute('viewBox', viewBox)

    Array.from(svg.childNodes).forEach((child) => {
      symbol.appendChild(child.cloneNode(true))
    })

    spritemap.appendChild(symbol)
  }

  return serializer.serializeToString(spritemap)
}

export default function SvgSpritemapDevPlugin(svgDirName = '_svg') {
  let svgDir = ''
  let spritemap = ''

  return {
    name: 'housefun-svg-spritemap-dev',
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

export { clientEvent, spritemapRoute }
