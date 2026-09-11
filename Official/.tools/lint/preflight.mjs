// 前提檢查 —— 列出「哪幾條規則因為缺了什麼而沒有作用」。
//
// 規則要能運作,通常得先有對應的東西存在:檢查 api 命名的前提是專案裡有 api 目錄,
// 建議 import 該用哪個 alias 的前提是讀得到建置設定。
//
// 缺了前提的規則不會報錯,它只是掃不到任何檔案 —— 結果是「全部通過」,
// 看起來跟真的沒問題一模一樣。這支就是把那層假象拆開:
// 檢查結果旁邊一定會寫出「這幾條這次沒有作用,因為缺什麼」。
//
// 目錄位置與候選檔名都來自 project-config.mjs,這裡不寫死任何路徑。

import fs from 'node:fs'
import path from 'node:path'
import {
  API_DIR,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  CSS_MODULES_DIR,
  PARALLEL_AWAIT_HELPER,
  STORE_DIR,
  VIEWS_DIR,
} from './project-config.mjs'

const hasDir = (root, rel) => {
  const abs = path.join(root, ...rel.split('/'))
  return fs.existsSync(abs) && fs.statSync(abs).isDirectory()
}

const firstExistingFile = (root, names) => names.find((n) => fs.existsSync(path.join(root, n))) ?? null

/**
 * 每一項前提:缺了它,rules 列出的那幾條規則就完全不會有結果。
 *
 * `need` 寫的是「要有什麼」,`why` 寫的是「沒有的話會怎樣」——
 * 兩句都要能單獨讀懂,看的人不必再翻別的檔案才知道該補什麼。
 */
const REQUIREMENTS = [
  {
    label: '建置設定檔',
    rules: ['importAlias'],
    check: (root) => firstExistingFile(root, BUILD_CONFIG_FILES),
    need: `專案根目錄要有這幾支其中一支:${BUILD_CONFIG_FILES.join(' / ')}`,
    why: 'alias 有哪些只有建置設定知道。讀不到就無法判斷相對路徑該改成哪一個 alias,這條會整條略過。',
  },
  {
    label: '色票目錄',
    rules: ['color', 'colorFile'],
    check: (root) => (hasDir(root, COLOR_CSS_DIR) ? COLOR_CSS_DIR : null),
    need: `要有色票目錄(目前設定為 ${COLOR_CSS_DIR})`,
    why: '色票變數的定義來源在那裡。目錄不存在時,等於一個色票變數都沒定義,顏色檢查與色票排序都不會有結果。',
  },
  {
    label: 'CSS 模組目錄',
    rules: ['moduleOrder', 'moduleScope', 'moduleVar', 'variable'],
    check: (root) => (hasDir(root, CSS_MODULES_DIR) ? CSS_MODULES_DIR : null),
    need: `要有 CSS 模組目錄(目前設定為 ${CSS_MODULES_DIR})`,
    why: '這四條只檢查模組目錄底下的檔案。目錄不存在時掃不到任何檔案,結果一律是通過。',
  },
  {
    label: 'api 目錄',
    rules: ['apiClient', 'apiScope', 'apiSource', 'apiNaming', 'apiReturn'],
    check: (root) => (hasDir(root, API_DIR) ? API_DIR : null),
    need: `要有 api 目錄(目前設定為 ${API_DIR})`,
    why: 'api 的五條規則只看那個目錄底下的檔案。目錄位置不符時,api 寫法完全不會被檢查。',
  },
  {
    label: 'store 目錄',
    rules: ['storeDeclare', 'storeNaming', 'storeScope', 'storeActions', 'storeActionNaming', 'storeActionReturn', 'storeApiDefault', 'storeResetDefault', 'storeLayer'],
    check: (root) => (hasDir(root, STORE_DIR) ? STORE_DIR : null),
    need: `要有 store 目錄(目前設定為 ${STORE_DIR})`,
    why: 'store 與 actions 的規則以那個目錄為範圍。位置不符時,store 的寫法完全不會被檢查。',
  },
  {
    label: '頁面目錄',
    rules: ['apiScope', 'storeScope', 'storeLayer', 'pageApiData', 'pageActionNaming', 'pageApiImport'],
    check: (root) => (hasDir(root, VIEWS_DIR) ? VIEWS_DIR : null),
    need: `要有頁面目錄(目前設定為 ${VIEWS_DIR})`,
    why: 'api 檔名、store 檔名與分層都是拿頁面目錄的第一層資料夾來對照。目錄不存在時,那些對照沒有比對基準,頁面規則也掃不到檔案。',
  },
  {
    label: '並行載入的包裝函式',
    rules: ['pageAwaitAll'],
    check: () => PARALLEL_AWAIT_HELPER.name || null,
    need: '設定裡要填 PARALLEL_AWAIT_HELPER 的 name 與 source（把多個請求一起發出的那支共用函式）',
    why: '這條要求進入頁面時的請求一起發出。專案沒有這支共用函式時整條略過，不會誤報 —— 有些框架自己就會處理並行載入，不需要這一層。',
  },
  {
    label: '共用元件目錄',
    rules: ['tailwind'],
    check: (root) => (hasDir(root, COMPONENTS_DIR) ? COMPONENTS_DIR : null),
    need: `要有共用元件目錄(目前設定為 ${COMPONENTS_DIR})`,
    why: '「元件的 template 不寫 tailwind class」只針對共用元件。目錄不存在時這條不會有結果。',
  },
]

/**
 * 回傳缺前提的項目清單(每項含缺什麼、影響哪幾條、會怎樣)。
 * 全部齊備時回空陣列。
 */
export const preflight = (root) =>
  REQUIREMENTS.filter((r) => !r.check(root)).map(({ label, rules, need, why }) => ({
    label,
    rules,
    need,
    why,
  }))

/** 缺前提時印出說明;齊備就什麼都不印(通過的情況不需要噪音) */
export const onReportPreflight = (root, { print = console.error } = {}) => {
  const missing = preflight(root)
  if (!missing.length) return missing

  print('')
  print(`⚠ 有 ${missing.length} 項前提不存在,以下規則這次沒有作用:`)

  for (const { label, rules, need, why } of missing) {
    print('')
    print(`  ${label} —— 影響 ${rules.length} 條規則:${rules.join('、')}`)
    print(`    要補的是:${need}`)
    print(`    沒有的話:${why}`)
  }

  print('')
  print('  這些規則不會報錯,也不會誤報 —— 它們只是掃不到東西,結果會顯示通過。')
  print('  目錄位置與專案實際不符時,改 .tools/lint/project-config.mjs 的對應設定即可。')

  return missing
}
