import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import { optimize } from 'svgo'

const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.webp',
])

const svgConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupNumericValues: false,
          cleanupIds: {
            minify: false,
            remove: false,
          },
          convertPathData: false,
        },
      },
    },
    'sortAttrs',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
      },
    },
  ],
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return collectFiles(fullPath)
      }

      return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : []
    })
  )

  return files.flat()
}

async function optimizeRaster(filePath, extension) {
  const input = await readFile(filePath)
  let transformer = sharp(input, { animated: extension === '.gif' })

  switch (extension) {
    case '.png':
      transformer = transformer.png({ compressionLevel: 9, palette: true })
      break
    case '.jpg':
    case '.jpeg':
      transformer = transformer.jpeg({ mozjpeg: true, quality: 82 })
      break
    case '.webp':
      transformer = transformer.webp({ quality: 82 })
      break
    case '.avif':
      transformer = transformer.avif({ quality: 55 })
      break
    case '.gif':
      transformer = transformer.gif({ reuse: true, effort: 10 })
      break
    case '.tif':
    case '.tiff':
      transformer = transformer.tiff({ quality: 82 })
      break
    default:
      return null
  }

  return transformer.toBuffer()
}

async function optimizeFile(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const original = await readFile(filePath)
  let optimized = null

  if (extension === '.svg') {
    const result = optimize(original.toString('utf8'), {
      ...svgConfig,
      path: filePath,
    })

    optimized = Buffer.from(result.data)
  } else {
    optimized = await optimizeRaster(filePath, extension)
  }

  if (!optimized || optimized.length >= original.length) {
    return { changed: false, savedBytes: 0 }
  }

  await writeFile(filePath, optimized)

  return {
    changed: true,
    savedBytes: original.length - optimized.length,
  }
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`
}

export async function optimizeDirectory(targetDir) {
  const targetStats = await stat(targetDir).catch(() => null)

  if (!targetStats?.isDirectory()) {
    return {
      changedCount: 0,
      checkedCount: 0,
      exists: false,
      savedBytes: 0,
    }
  }

  const files = await collectFiles(targetDir)
  let changedCount = 0
  let savedBytes = 0

  for (const filePath of files) {
    const result = await optimizeFile(filePath)

    if (!result.changed) {
      continue
    }

    changedCount += 1
    savedBytes += result.savedBytes
  }

  return {
    changedCount,
    checkedCount: files.length,
    exists: true,
    savedBytes,
  }
}
