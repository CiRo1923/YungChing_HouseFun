import { cp, mkdir, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import { formatKilobytes, optimizeDirectory } from './image-optimizer.mjs'

const dotenvFile = process.argv[2]
const PUBLIC_IMAGE_SUBDIR = path.join('assets', 'imgs')
const sourceDir = path.resolve('public', PUBLIC_IMAGE_SUBDIR)
const tempRoot = path.resolve('.cache/public-image-build')
const backupDir = path.join(tempRoot, 'original')
const compressedDir = path.join(tempRoot, 'compressed')
const nuxtBin = path.resolve('node_modules/nuxt/bin/nuxt.mjs')

let swapped = false
let sourceExists = false

async function removeIfExists(targetPath) {
  await rm(targetPath, { recursive: true, force: true })
}

async function restoreOriginal() {
  if (!swapped) {
    await removeIfExists(tempRoot)
    return
  }

  await removeIfExists(sourceDir)
  await rename(backupDir, sourceDir)
  swapped = false
  await removeIfExists(tempRoot)
}

async function prepareCompressedCopy() {
  const sourceStats = await stat(sourceDir).catch(() => null)

  if (!sourceStats?.isDirectory()) {
    return {
      changedCount: 0,
      checkedCount: 0,
      exists: false,
      savedBytes: 0,
    }
  }

  sourceExists = true
  await removeIfExists(tempRoot)
  await mkdir(tempRoot, { recursive: true })
  await cp(sourceDir, compressedDir, { recursive: true })

  const result = await optimizeDirectory(compressedDir)

  await rename(sourceDir, backupDir)
  await rename(compressedDir, sourceDir)
  swapped = true

  return result
}

function runNuxtBuild() {
  const args = [nuxtBin, 'build']

  if (dotenvFile) {
    args.push('--dotenv', dotenvFile)
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function main() {
  const result = await prepareCompressedCopy()

  if (!result.exists) {
    console.log(`Skipped public image copy compression: \`public/${PUBLIC_IMAGE_SUBDIR}\` not found.`)
  } else if (result.checkedCount === 0) {
    console.log(`Skipped public image copy compression: no supported image files found under public/${PUBLIC_IMAGE_SUBDIR}.`)
  } else if (result.changedCount === 0) {
    console.log(
      `Prepared copied public images for build from public/${PUBLIC_IMAGE_SUBDIR}; checked ${result.checkedCount} files, no smaller output was produced.`
    )
  } else {
    console.log(
      `Prepared copied public images for build from public/${PUBLIC_IMAGE_SUBDIR}; optimized ${result.changedCount}/${result.checkedCount} files and saved ${formatKilobytes(result.savedBytes)}.`
    )
  }

  const exitCode = await runNuxtBuild()
  await restoreOriginal()
  process.exitCode = exitCode
}

const shutdown = async () => {
  if (sourceExists) {
    await restoreOriginal()
  }
}

process.on('SIGINT', () => {
  shutdown()
    .catch(() => {})
    .finally(() => process.exit(130))
})

process.on('SIGTERM', () => {
  shutdown()
    .catch(() => {})
    .finally(() => process.exit(143))
})

main().catch(async (error) => {
  await restoreOriginal().catch(() => {})
  console.error('Failed to prepare copied public images for Nuxt build.')
  console.error(error)
  process.exitCode = 1
})
