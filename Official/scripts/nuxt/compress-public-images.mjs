import path from 'node:path'

import { formatKilobytes, optimizeDirectory } from './image-optimizer.mjs'

const PUBLIC_IMAGE_SUBDIR = path.join('assets', 'imgs')
const PUBLIC_IMAGE_DIR = path.resolve('public', PUBLIC_IMAGE_SUBDIR)

async function main() {
  const result = await optimizeDirectory(PUBLIC_IMAGE_DIR)

  if (!result.exists) {
    console.log(`Skipped public image compression: \`${PUBLIC_IMAGE_DIR}\` not found.`)
    return
  }

  if (result.checkedCount === 0) {
    console.log('Skipped public image compression: no supported image files found.')
    return
  }

  if (result.changedCount === 0) {
    console.log(
      `Public image compression checked ${result.checkedCount} files under public/${PUBLIC_IMAGE_SUBDIR}, no smaller output was produced.`
    )
    return
  }

  console.log(
    `Public image compression optimized ${result.changedCount}/${result.checkedCount} files under public/${PUBLIC_IMAGE_SUBDIR} and saved ${formatKilobytes(result.savedBytes)}.`
  )
}

main().catch((error) => {
  console.error('Failed to compress public images.')
  console.error(error)
  process.exitCode = 1
})
