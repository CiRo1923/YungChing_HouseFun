import { readFileSync, readdirSync } from 'node:fs'
import { relative, sep } from 'node:path'

type NuxtImport = {
  name: string
  as: string
  from: string
}

const pascalCase = (value: string) =>
  value
    .split(/[\\/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const toImportPath = (value: string) => value.split(sep).join('/')

export const getStoreComposableImports = (
  storesDir: string,
  relativeDir = ''
): NuxtImport[] => {
  const imports: NuxtImport[] = []
  const dir = relativeDir ? `${storesDir}/${relativeDir}` : storesDir

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const entryRelativeDir = relativeDir ? `${relativeDir}/${entry.name}` : entry.name

      if (entry.name === '.composables') {
        const parentRelativeDir = toImportPath(relative(storesDir, dir))
        const prefix = pascalCase(parentRelativeDir)

        for (const file of readdirSync(`${dir}/${entry.name}`)) {
          const match = file.match(/^use([A-Z].*)\.[cm]?[jt]s$/)

          if (!match) {
            continue
          }

          imports.push({
            name: 'default',
            as: `use${prefix}${match[1]}`,
            from: `@stores/${toImportPath(entryRelativeDir)}/${file}`,
          })
        }

        continue
      }

      imports.push(...getStoreComposableImports(storesDir, entryRelativeDir))
    }
  }

  return imports
}

export const getStoreImports = (storesDir: string, relativeDir = ''): NuxtImport[] => {
  const imports: NuxtImport[] = []
  const dir = relativeDir ? `${storesDir}/${relativeDir}` : storesDir

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryRelativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      if (entry.name === '.composables') {
        continue
      }

      imports.push(...getStoreImports(storesDir, entryRelativePath))
      continue
    }

    if (!relativeDir || !/\.[cm]?[jt]s$/.test(entry.name)) {
      continue
    }

    const content = readFileSync(`${storesDir}/${entryRelativePath}`, 'utf8')
    const matches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*defineStore/g)

    for (const match of matches) {
      imports.push({
        name: match[1],
        as: match[1],
        from: `@stores/${toImportPath(entryRelativePath)}`,
      })
    }
  }

  return imports
}
