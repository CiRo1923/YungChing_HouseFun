import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export type PageComponentDir = {
  path: string
  prefix: string
  pathPrefix: boolean
}

export const pascalCase = (value: string) =>
  value
    .split(/[\\/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

export const getPageComponentDirs = (pagesDir: string, relativeDir = ''): PageComponentDir[] => {
  const dirs: PageComponentDir[] = []
  const dir = relativeDir ? join(pagesDir, ...relativeDir.split('/')) : pagesDir

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const entryRelativeDir = relativeDir ? `${relativeDir}/${entry.name}` : entry.name

    if (entry.name === '_components') {
      const prefix = `Page${pascalCase(relativeDir)}`

      if (prefix) {
        dirs.push({
          path: `~/pages/${entryRelativeDir}`,
          prefix,
          pathPrefix: true,
        })
      }

      continue
    }

    dirs.push(...getPageComponentDirs(pagesDir, entryRelativeDir))
  }

  return dirs
}
