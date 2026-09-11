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
import { isColorNamingConfigFit, isHueSourceFit } from './color-order.mjs'
import { hasBreakpointVars, hasResponsiveStyles } from './lint-core.mjs'
import { detectViewResourceDepth } from './shared.mjs'
import {
  API_DIR,
  BREAKPOINTS,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  CSS_MODULES_DIR,
  PARALLEL_AWAIT_HELPER,
  STORE_DIR,
  STYLE_CONFIG_FILES,
  VIEW_RESOURCE_DEPTH,
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
    label: '樣式設定檔',
    rules: ['theme', 'themeNaming'],
    check: (root) => firstExistingFile(root, STYLE_CONFIG_FILES),
    need: `專案根目錄要有這幾支其中一支:${STYLE_CONFIG_FILES.join(' / ')}`,
    why: 'theme 覆寫了哪幾類、各類定義了哪些值,只有樣式設定檔知道。讀不到的話,「用到已消失的 class」與「重新定義的值不要用尺寸縮寫」兩條都會整條略過。',
  },
  {
    label: '色票目錄',
    rules: ['color', 'colorFile'],
    check: (root) => (hasDir(root, COLOR_CSS_DIR) ? COLOR_CSS_DIR : null),
    need: `要有色票目錄(目前設定為 ${COLOR_CSS_DIR})`,
    why: '色票變數的定義來源在那裡。目錄不存在時,等於一個色票變數都沒定義,顏色檢查與色票排序都不會有結果。',
  },
  {
    label: '色相判斷來源的設定',
    rules: ['colorFile'],

    /*
     * 大宗是「超過一半的那一種」。設定與大宗不符時,那一大批變數會走錯路徑,
     * 而兩個方向壞掉的樣子不一樣:
     *
     *   設定 name、多數是語意名   那一批每一個都被報「認不出色相前綴」,
     *                             而且排序會把它們全部歸成未知色重排一次
     *   設定 value、多數帶色相     人給的語意分類(把橘定義為金)被色值算的結果蓋掉
     */
    check: isHueSourceFit,
    need: '設定裡的 COLOR_HUE_SOURCE 要符合專案實際的色票命名(名字帶色相用 name,語意名用 value)',
    why: '色票檔裡超過一半的變數,命名方式與設定選的來源不同。設定是 name 而實際是語意名的話,那一批會每一個都被報「認不出色相前綴」,排序還會把它們重排成一大群未知色;設定是 value 而實際帶色相的話,名字裡人給的語意分類會被色值算出來的結果蓋掉。',
  },
  {
    label: '色票命名的設定',
    rules: ['colorFile'],

    /*
     * 判準是「整組一個都對不上」,不是「多數對不上」。
     *
     * 設定與專案對不上時,結果一定是整組落空 —— 那幾項設定影響的是該組的每一個變數。
     * 只有部分對不上的話,那是個別變數命名不符規範,逐筆報在檢查結果裡,
     * 不該在這裡再講一次。
     */
    check: isColorNamingConfigFit,
    need: '設定裡的 COLOR_HUES、COLOR_NAME_SEPARATOR 與 COLOR_SUFFIX_PICK 要符合專案實際的色票命名',
    why: '色票檔裡有一整類變數的命名形狀對不上目前的設定 —— 可能是全部(色相清單或分隔符不同),也可能是帶透明度的那一類(透明度兩碼怎麼接不同)。那一類的取碼檢查會完全沒有結果,而畫面上看起來是全部通過。改設定就會恢復。',
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
    label: '頁面資源的層級',
    rules: ['apiScope', 'storeScope', 'storeLayer'],

    /*
     * 判斷方式是看第一層的資料夾底下有沒有直接放頁面:有就是資源層(深度 1),
     * 沒有就是分類層(深度 2)。設錯的話,每一支 api 與 store 都會被報
     * 「對不上資料夾」—— 那一整片訊息說的其實是同一件事。
     */
    check: (root) => {
      const detected = detectViewResourceDepth(root)
      return detected === null || detected === VIEW_RESOURCE_DEPTH
    },
    need: `設定裡的 VIEW_RESOURCE_DEPTH 要符合頁面目錄的擺法(目前設定為 ${VIEW_RESOURCE_DEPTH})`,
    why: '頁面目錄的實際擺法與設定的層級不同。api 檔名與 store 檔名都是拿那一層的資料夾名來對照,層級錯了就每一支都對不上 —— 那不是命名寫錯,是這一項設錯了。第一層直接放頁面的專案填 1,第一層只放分類、資源在第二層的填 2。',
  },
  {
    label: '響應式的斷點',
    rules: ['variable'],

    /*
     * 設成空陣列是刻意的(不做響應式的專案),不是缺東西 —— 所以專案確實
     * 沒有響應式寫法時就不提醒。有 `@screen` 或寬度 media query 卻設成空的話,
     * 那是設定漏填,要講出來:那兩條規則從此不檢查任何東西。
     */
    check: (root) => BREAKPOINTS.length > 0 || !hasResponsiveStyles(root),
    need: '設定裡要填 BREAKPOINTS(尺寸值要分成哪幾個斷點)',
    why: 'CSS 模組裡有響應式寫法(@screen 或寬度 media query),但斷點設定是空的 —— 「斷點要成套」與「尺寸值要分斷點」兩條會整條略過,那些該分斷點卻沒分的變數不會被報出來。',
  },
  {
    label: '斷點設定與專案實際的用法',
    rules: ['variable'],

    /*
     * 設定填了斷點,但整個 CSS 模組裡一個斷點變數都沒有 —— 那多半是
     * 換專案時忘了改這一項。不講的話,每一個尺寸變數都會被要求拆成三份,
     * 而那個專案根本不做響應式,補出來的值永遠相同。
     */
    check: (root) => !BREAKPOINTS.length || hasBreakpointVars(root),
    need: `專案要實際用到設定的斷點(目前設定為 ${BREAKPOINTS.join(' / ') || '(空)'}),不用的話把 BREAKPOINTS 設成空陣列`,
    why: '設定填了斷點,但 CSS 模組裡找不到任何一個帶斷點的變數。這種情況下每一個尺寸值都會被要求拆成三份,等於要補上一大批永遠相同的值 —— 不做響應式的專案應該把 BREAKPOINTS 設成空陣列。',
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
