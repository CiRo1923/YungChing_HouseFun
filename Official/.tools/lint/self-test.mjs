#!/usr/bin/env node
// 規則自我驗證 —— 確認每條檢查「真的抓得到違規」,而且「不會誤報合法寫法」。
//
//   npm run test:css
//
// 為什麼需要這個:npm run lint:css 通過只代表「現在的程式碼沒有違規」,
//    不代表「規則還有效」。改壞一條 regex 之後全案照樣通過 —— 那條規則從此靜靜失效,
//    等到有人寫出違規才發現,而那時已經散了一堆。
//    這支反過來測工具本身:餵違規進去必須被抓、餵合法寫法進去必須放行。
//
// 走的是 lintFile 的完整路徑(而不是直接呼叫各個 check),所以連「哪個路徑跑哪些檢查」
// 的分派邏輯也一起驗到。
//
// 注意:探測檔會實際寫進專案目錄(檢查依路徑前綴決定要不要跑,不能寫在別處)。
//    每次執行前會先清掉前一次的殘骸,結束時(含中途丟例外)一定會刪除。
//
// 注意:dev server 執行中時跑這支,自動產生型別的外掛(unplugin-vue-components)
//    會掃到 src/components/ 底下的探測檔,把它們寫進 components.d.ts ——
//    探測檔刪掉之後那些宣告仍會殘留。看到 d.ts 多出 CssSelfTest* 就是這個原因,
//    直接 git checkout 還原即可,不要 commit 進去。
//
// ─── 搬到別的專案時,哪些要換、哪些可以整段搬 ───────────────────────────
//
// 案例依「綁不綁專案」分成兩類,各自收在自己的陣列裡,不混在一起 ——
// 混在一起的話,想只取其中一半就得從上千行裡逐一挑,而案例是跨多行的
// 程式碼區塊,沒有可靠的分界;結果不是整份覆蓋(另一半的驗證全部消失),
// 就是放棄不搬。
//
//   陣列                    驗什麼                          換專案時
//   CSS_CASES               色票、tailwind、模組 css、變數   換成該專案自己的
//   SORT_CASES              色票排序                        換成該專案自己的
//   EMPTY_RULE_CASES        空的 css 規則區塊移除            換成該專案自己的
//   RULE_CASES              api、store、頁面、import、全站   整段搬
//   WRAP_MOUNTED_CASES      onMounted 的並行載入包裝         整段搬
//   SORT_COMPOSABLE_CASES   composable 宣告順序              整段搬
//
// 「整段搬」那幾份只依賴 project-config.mjs 的目錄設定,案例內容本身
// 不含任何專案專屬的東西(路徑都是用設定常數組出來的)。
//
// lint-project-name-exempt: 要驗「專案名稱有沒有被抓到」,案例裡就必須出現本專案的名稱
// lint-absolute-path-exempt: 要驗「絕對路徑有沒有被抓到」,案例裡就必須出現絕對路徑
// lint-plain-text-exempt: 要驗「裝飾符號有沒有被抓到」,案例裡就必須出現那些符號
// lint-self-contained-exempt: 要驗「同上那類寫法有沒有被抓到」,案例裡就必須出現那些詞

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  COLOR_NAME_SEPARATOR,
  addColorDecls,
  expectedSuffix,
  withAlpha,
  HUE_LIST_TEXT,
  hueOf,
  isSorted,
  isSuffixNamingChecked,
  loadDefinedColorVars,
  majorityHueSource,
  parseColorBlocks,
  sortColorCss,
} from './color-order.mjs'
import {
  checkSharedColors,
  lintFile,
  lintText,
  PROJECT_RULE_PREFIX,
  onRemoveEmptyRules,
  onFixLegacyRgba,
  onSortComposables,
  onSortImports,
  singleModuleVarsOf,
  onWrapMountedCalls,
  onCloneApiDefault,
  RULE_TITLE,
  TOOL_STATE_RULES,
} from './lint-core.mjs'
import { NO_PREREQUISITE_RULES, PREFLIGHT_RULES } from './preflight.mjs'
import { aliasListOf, importGroupOf, tailwindThemeOf } from './rules-code.mjs'
import {
  CONFIG_FILE,
  IS_SOURCE_PROJECT,
  PROJECT_DIR_VALUES,
  configItemIssueOf,
  unusedConfigNames,
} from './rules-global.mjs'
import { apiFieldNamesOf, specFieldsIn } from './rules-api.mjs'
import { isStoreDeclareCall } from './rules-store.mjs'
import { CHECKSUM_FILE, currentFingerprints, fingerprintDiff, isSkipped } from './checksum.mjs'
import {
  ACTIONS_DIR_NAME,
  API_DIR,
  API_NAMING_IGNORED_SEGMENTS,
  API_SPEC_DIR,
  BREAKPOINTS,
  BREAKPOINT_SCREENS,
  BUILD_CONFIG_FILES,
  DEEP_CLONE_HELPER,
  COLOR_CSS_DIR,
  CONVENTION_DOCS_DIR,
  CONVENTION_RULES_DIR,
  CONVENTION_SKILLS_DIR,
  COLOR_CSS_PREFIX,
  COMPONENTS_DIR,
  COMPONENT_DIRS,
  CSS_MODULES_DIR,
  GENERATED_FILES,
  FORM_GROUP_VALIDATOR,
  IMPORT_ORDER_GROUPS,
  IS_FILE_BASED_ROUTING,
  MODULE_CSS_DIR_NAME,
  PARALLEL_AWAIT_HELPER,
  PROJECT_DOCS_DIR,
  PROJECT_NAMES,
  PROJECT_NAME_SCOPE,
  SHARED_API_FILE,
  SHARED_MODULE_VARIABLES,
  SOURCE_PROJECT_NAME,
  SRC_DIR,
  STANDALONE_STORES,
  STORE_DIR,
  TAILWIND_THEME_OVERRIDES,
  VIEW_RESOURCE_DEPTH,
  VIEWS_DIR,
  VIEW_UNDERSCORE_FOLDERS,
} from './project-config.mjs'
import {
  classPrefixOf,
  detectViewResourceDepth,
  isUnderAny,
  listConventionRules,
  listConventionSkills,
  listViewFolders,
  listViewSubFolders,
  resetScanCaches,
} from './shared.mjs'
import { BOLD, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/**
 * 這條規則是不是每個專案都有的那一套。
 *
 * 專案自己的規則(`rules-project.mjs`,代號帶 `project:` 前綴)不算 ——
 * 它們由那個專案自己維護,來源這邊的文件、寫法規範、前提清單都不會提到它們。
 * 拿來源的清單去要求它們,結果是每一個有專案規則的地方都固定紅字,
 * 而那個紅字說的是「文件沒寫」,實際上是**沒有地方可以寫**。
 *
 * 那幾條靠另一道把關:`onCheckProjectRules` 要求每一條都有自己的驗證案例,
 * 而案例與規則寫在同一支檔案裡,改了規則忘了改案例會當場被抓到。
 *
 * 判斷收在這裡一份 —— 底下有好幾項驗證都要問同一件事,
 * 各寫一次的話,新增一項時很容易漏掉其中一處(這正是發生過的事)。
 */
const isSharedRule = (rule) => !rule.startsWith(PROJECT_RULE_PREFIX)

// 探測用的色票要等 onPrepare 建好才讀得到,所以這裡先放著,執行時再更新
let definedVars = loadDefinedColorVars(root)

/**
 * 探測檔的資料夾名 —— 取得夠特別,誤留下來也一眼看得出是什麼。
 *
 * 每一種規則的探測檔都放在**該規則管的那個目錄底下的子資料夾**裡:
 * 直接放在目錄第一層會與正式檔案撞名(home.js / member.js 這些),把真的檔案覆蓋掉。
 * 規則只看檔名,放子資料夾一樣驗得到。
 */
const PROBE = '__css-self-test__'

/* 目錄位置一律從設定算出來(project-config.mjs)——
   驗證要驗的是「這個專案的設定底下規則能不能運作」。
   路徑寫死的話,換一個專案改了設定,驗證仍然在原本的位置建探測檔,
   驗到的就不是那個專案的設定,而且會顯示通過。 */

/**
 * 跨模組共用樣式的探測檔 —— 那幾支放在集中目錄。
 *
 * 變數命名與斷點那幾條兩種位置都管(元件自己的樣式、跨模組共用的變數),
 * 這一組驗的是後者。前者由下面的 S 驗,兩種位置各有案例守著。
 *
 * 名字刻意與元件那一組不同 —— 對得上某個元件的樣式本來就該搬進那個元件的資料夾
 * (規則 moduleLocation),同名的話這一整組都會被它報一筆。
 */
const M = `${CSS_MODULES_DIR}/${PROBE}Shared`

/** 共用元件規則的探測檔(template 不寫 tailwind class 那條) */
const C = `${COMPONENTS_DIR}/${PROBE}`

/**
 * 探測用的模組名。
 *
 * 不帶上面那個探測前綴,是因為 class 前綴要從資料夾名推出來
 * (`mCssSelfTest` → `m-css-self-test`),而帶底線的名字推不出模組前綴。
 *
 * **只寫這一份** —— 元件那邊與集中目錄那邊都用它,清除時也靠它認名字。
 * 各處自己寫一次字面的話,改名時漏掉哪一處不會報錯,
 * 只會留下一個看起來像真元件的資料夾。
 */
const PROBE_MODULE = 'mCssSelfTest'

/**
 * 元件自己的樣式的探測檔。
 *
 * 元件的 css 收在元件資料夾底下的樣式那一層,而 class 前綴是那一層外面的
 * 資料夾名推出來的,所以路徑要完整帶到樣式那一層。
 */
const SC = `${COMPONENTS_DIR}/${PROBE_MODULE}`
const S = `${SC}/${MODULE_CSS_DIR_NAME}`

/**
 * 「對得上元件的樣式留在集中目錄」那一則的探測檔。
 *
 * 名字與上面那個探測元件相同 —— 規則要判斷的正是「這支樣式屬於某個元件」,
 * 所以集中目錄這一支要與元件同名才驗得到。
 */
const L = `${CSS_MODULES_DIR}/${PROBE_MODULE}`

/**
 * 元件目錄底下的分類層,以及分類層底下的那支元件。
 *
 * 元件目錄常常先分幾個大類,每一類底下才是元件;集中目錄也跟著分同樣的類。
 * 「這支樣式屬於哪一個元件」如果只看集中目錄的第一段,取到的會是分類名 ——
 * 一整批不同元件的樣式都會被判成屬於同一個「元件」,照著搬就全堆進同一個資料夾。
 *
 * 名字都帶著探測元件的名字,清除時掃元件目錄第一層就認得出來。
 */
const PROBE_GROUP = `${PROBE_MODULE}Group`
const PROBE_NESTED_MODULE = `${PROBE_MODULE}Chart`
const GC = `${COMPONENTS_DIR}/${PROBE_GROUP}`
const GL = `${CSS_MODULES_DIR}/${PROBE_GROUP}`

/**
 * api 規則看的是「檔名對不對得上頁面目錄的資料夾」,所以探測檔要放在 api 目錄底下。
 *
 * 注意:放**子資料夾**而不是直接放在 api 目錄第一層 —— 探測檔名會與正式檔案撞名,
 *    直接放的話會覆蓋掉真的 api 檔案。規則只看檔名,放子資料夾一樣驗得到。
 */
const A = `${API_DIR}/${PROBE}`

/** store 規則的探測檔 —— 同樣放子資料夾,避免與正式的 store 撞名覆蓋 */
const T = `${STORE_DIR}/${PROBE}`

/**
 * 探測頁面資料夾共同的開頭 —— 清除時靠它認出「這幾個是驗證自己建的」。
 *
 * 上一次執行中途失敗時,那些資料夾會留在頁面目錄底下。下一次執行看到它們已經
 * 存在就不會再建,也就不會記進清除清單 —— 於是永遠留在那裡,還會被規則
 * 當成真的頁面資料夾。清除時一律掃過去刪,殘留才不會累積。
 */
const PROBE_PAGE_PREFIX = 'selfTest'

/**
 * 第一層是分類層的專案(VIEW_RESOURCE_DEPTH 為 2),探測資源要放在這個分類底下。
 *
 * 名字用與探測頁面同一個開頭 —— 清除時掃頁面目錄第一層就會把它整個刪掉,
 * 不必為它多寫一條清除規則(多寫一條就會有忘了改的一天,而殘留不會報錯)。
 */
const PROBE_VIEW_GROUP = `${PROBE_PAGE_PREFIX}Group`

/**
 * 這段文字裡有沒有驗證自己造出來的名字。
 *
 * 三個地方都要問這件事:結束時要把自己造的東西刪乾淨、判斷「這個專案自己
 * 有沒有東西可以比對」時要把它們扣掉、清理自動產生的清單時要認出哪幾行是探測的。
 * 各寫一份的話,新增一種探測名只改了一邊 —— 不是留下殘留,
 * 就是把探測檔當成專案自己的內容拿去比對,兩種都不會報錯。
 *
 * 用「含有」而不是「開頭是」,所以一整行文字也問得動:自動產生的清單裡,
 * 探測元件的名字出現在行的中間(前面有縮排與識別字)。
 */
const isProbeName = (text) =>
  text.includes(PROBE) || text.includes(PROBE_MODULE) || text.includes(PROBE_PAGE_PREFIX)

/**
 * 把提到探測名字的行清掉,其餘一個字都不動。
 *
 * 收尾的清理與它的驗證共用這一份 —— 驗證自己再寫一次過濾的話,
 * 驗的就不是真正在跑的那段程式碼,清理壞掉時它照樣會通過。
 */
const withoutProbeLines = (text) =>
  text
    .split('\n')
    .filter((line) => !isProbeName(line))
    .join('\n')

/**
 * 探測用頁面資源資料夾的路徑。
 *
 * 「資源」是 api 檔名與 store 檔名要對得上的那一層。有的專案資源直接放第一層,
 * 有的第一層是分類層、資源在它底下 —— 哪一種由設定的 VIEW_RESOURCE_DEPTH 決定。
 *
 * 固定建在第一層的話,分類層的專案會把探測資源當成分類:每一則案例都多一筆
 * 「檔名對不上資料夾」,把要驗的那一筆擠掉,於是一整批案例在那種專案必定失敗 ——
 * 而失敗的原因與規則本身無關,是探測檔建錯了地方。
 */
const viewResourceDir = (resource) =>
  VIEW_RESOURCE_DEPTH >= 2
    ? `${VIEWS_DIR}/${PROBE_VIEW_GROUP}/${resource}`
    : `${VIEWS_DIR}/${resource}`

/**
 * 頁面規則的探測檔 —— 資源在第幾層由設定決定。
 *
 * 名字不帶底線:頁面目錄的資料夾一律對應網址,底線開頭的那種是列在設定裡的例外
 * (規則 viewFolder)。用底線開頭的探測名的話,每一則放在這裡的案例
 * 都會先撞到那一條,而它們要驗的根本是別的規則。
 *
 * 清理仍然認得它 —— 探測名的判斷(isProbeName)也認 PROBE_PAGE_PREFIX 這個開頭。
 */
const P = viewResourceDir(`${PROBE_PAGE_PREFIX}Probe`)

/**
 * 探針用的一組斷點變數,每個斷點各一份。
 *
 * 斷點叫什麼、有幾個都從設定取(BREAKPOINTS)—— 寫死 pc / tablet / mobile 的話,
 * 換一個命名的專案,這幾則驗到的是別人的斷點名;不做響應式的專案更是
 * 每一則都必定失敗,而失敗的原因與規則本身無關。
 *
 * 值由大到小遞減,像真的響應式寫法;`skipLast` 是刻意少寫最後一個斷點,
 * 用來驗「斷點要成套」那一條抓不抓得到缺的那一份。
 */
const breakpointVars = (suffix, { skipLast = false } = {}) => {
  const list = skipLast ? BREAKPOINTS.slice(0, -1) : BREAKPOINTS

  return list.map((bp, i) => `  --probe-${bp}-${suffix}: ${40 - i * 4}px;`).join('\n')
}

/**
 * 規格文件裡真的有的一個欄位名,與一個文件裡一定沒有的名字。
 *
 * 名字從專案自己的規格文件現場取,不寫死 —— 寫死的話這幾則案例
 * 會帶著某一個專案的 api 欄位名複製到下一個專案,而那裡沒有那個欄位,
 * 案例只會開始失敗;欄位名也不該跟著工具到處跑。
 *
 * 取不到文件時是 null,那幾則案例整組跳過(規則那一側也是整條略過)。
 */
const apiSpecFields = (() => {
  if (!API_SPEC_DIR) return null

  const [known] = [...(specFieldsIn(path.join(root, API_SPEC_DIR)) ?? [])]

  return known ? { known, unknown: `${PROBE_PAGE_PREFIX}CustomField` } : null
})()

/**
 * 規範系統自身的探測檔。
 *
 * skills、rules 與說明文件都是 .md,那些檔案會整批複製到下一個專案 ——
 * 沒被掃到的話,裡面寫死的專案名稱與某台機器的路徑不會有人發現。
 *
 * 位置取自「不寫死專案名稱」那條規則的適用範圍第一個前綴,不寫死目錄名 ——
 * 每個專案的規範系統擺在哪由設定決定,寫死的話換一個專案這幾則驗證
 * 永遠不會命中,看起來像規則壞了。
 */
const D = `${PROJECT_NAME_SCOPE[0]}${PROBE}`

/**
 * 專案自己的文件目錄的探測檔 —— 驗證每一條規則都不碰這一層。
 *
 * 那裡放的是寫給這個專案的內容,提到專案名稱、貼一段實際路徑、
 * 引用一段不合規範的範例程式碼都是正常的。
 */
const PD = `${PROJECT_DOCS_DIR}/${PROBE}`

/** 檔名規則那幾則的內容 —— 它們看的是檔名,內容只要是一支合法的元件就好 */
const probeVue = `<template>\n  <div class="m-probe"></div>\n</template>\n`

const PROBE_DIRS = [M, C, SC, L, GC, GL, A, T, `${T}/${ACTIONS_DIR_NAME}`, P, D, PD]

/**
 * 案例會寫檔、但不在 PROBE_DIRS 底下的那幾層 —— 靠**名字**認出探測檔。
 *
 * 那幾層與正式檔案混在一起(色票檔、頁面目錄的第一層),整個刪掉會刪到真的東西,
 * 所以逐一比對名字。`dir` 空字串代表專案根。
 *
 * cleanup 與「案例的檔案清不清得掉」那道檢查讀的是這同一份 ——
 * 各寫一份的話,新增一個位置時只有其中一邊跟著改,而漏掉的那一邊不會報錯:
 * 不是清不掉,就是明明清得掉卻被報成會殘留。
 */
const PROBE_SWEEPS = [
  { dir: '', match: isProbeName },
  { dir: CSS_MODULES_DIR, match: isProbeName },
  ...COMPONENT_DIRS.map((dir) => ({ dir, match: isProbeName })),
  { dir: COLOR_CSS_DIR, match: (name) => name.startsWith(PROBE_COLOR_PREFIX) },
  { dir: VIEWS_DIR, match: isProbeName },
]

/**
 * 從探測用的頁面檔,走相對路徑指到 api 目錄底下某一支檔案。
 *
 * 「離開自己資料夾要用 alias」與「頁面不要直接 import api」兩條規則都要靠它造資料。
 * 路徑從設定算出來,不寫死 —— 每個專案的 api 目錄位置不一樣,
 * 寫死的話換一個專案這兩則驗證永遠不會命中,看起來像規則壞了。
 */
const apiImportPathOf = (fromDir, fileName) => {
  const relative = path.relative(fromDir, `${API_DIR}/${fileName}`).split(path.sep).join('/')

  // path.relative 對同層或下層不會加 ./,但 import 的相對路徑一定要有
  return relative.startsWith('.') ? relative : `./${relative}`
}

/**
 * 用 alias 寫出「指到 api 目錄底下某一支檔案」的 import 路徑。
 *
 * 「頁面不要直接 import api」那條要單獨驗,所以路徑本身必須是合規的寫法 ——
 * 用相對路徑的話會同時命中「離開自己資料夾要用 alias」,那則驗證就分不出
 * 抓到的是哪一條。
 *
 * alias 從專案的建置設定讀出來,取涵蓋 api 目錄、名稱最深的那一個。
 * 專案沒有任何 alias 涵蓋 api 目錄時回 null,呼叫端改用相對路徑。
 */
const apiAliasImportOf = (fileName) => {
  const apiAbs = path.resolve(root, API_DIR)
  const hit = aliasListOf(root).find(
    (a) => apiAbs === a.root || apiAbs.startsWith(a.root + path.sep)
  )
  if (!hit) return null

  const rest = path.relative(hit.root, apiAbs).split(path.sep).join('/')

  return rest ? `${hit.alias}/${rest}/${fileName}` : `${hit.alias}/${fileName}`
}

/* 有幾條規則是「拿檔案跟專案現況比對」——
   api 與 store 的檔名要對得上頁面資料夾、色碼要對得上色票、import 要對得上 alias。
   驗這些規則需要那些東西存在,但**不能假設專案已經有** ——
   一個剛建立的專案什麼都還沒有,那時跑驗證會整批失敗,
   看起來像規則壞了,實際上只是還沒有東西可以比對。

   所以執行前會自己把需要的前提建起來,而且**只建不存在的**,
   結束時也只刪自己建的那幾個 —— 專案原本就有的完全不碰。 */

/* 探測用的頁面資料夾。名字取得夠特別,誤留下來一眼看得出是什麼。
   共同開頭(PROBE_PAGE_PREFIX)與資源路徑的算法定義在上面的探測檔路徑那一段 ——
   頁面探測檔的位置要用到它們。 */

const PROBE_PAGE_ALPHA = `${PROBE_PAGE_PREFIX}Alpha`

/**
 * 「元件的搭檔」那幾則專用的名字。
 *
 * 那幾則要的是「這個 store 只有一支檔案」—— 搭檔清單是拿匯出的名字回推檔案的,
 * 而別的案例也會用探測名建 store,兩支檔案匯出同一個名字時後建的那支會蓋掉前面,
 * 算出來的路徑就指向另一則案例的檔案。名字分開才不會互相干擾。
 */
const PROBE_DEPS_PAGE = `${PROBE_PAGE_PREFIX}Deps`
const PROBE_PAGE_PLURAL = `${PROBE_PAGE_PREFIX}Pets`

/**
 * 探測用頁面的分類資料夾與頁面檔 —— store 的分層規則拿它比對。
 *
 * 分類資料夾不佔一層,所以預期的層名是頁面檔名首字小寫(`Detail.vue` → `detail`),
 * 不是資料夾名。兩者刻意取不同的字,才驗得出規則取的是哪一個。
 */
const PROBE_PAGE_SUB_FOLDER = 'records'
const PROBE_PAGE_FILE = 'Detail.vue'
const PROBE_PAGE_LAYER = 'detail'

/**
 * 兩個放著同名頁面的分類資料夾 —— 驗「撞名時分類資料夾才佔一層」。
 *
 * 兩支都叫 Detail.vue,扁平的層名會撞在一起,所以期望的是
 * `<資料夾>.detail` 兩層,而不是單一個 `detail`。
 */
const PROBE_CLASH_FOLDER_A = 'alpha'
const PROBE_CLASH_FOLDER_B = 'beta'

/* 第二個探測頁面,底下**不放**任何頁面檔。
   測「store 只放宣告」「store 命名」這類規則時要用它 ——
   用有頁面檔的那個頁面群,每個案例都會多被分層規則抓一筆,
   那筆跟案例要驗的事情無關,只會讓預期數字對不上。 */
const PROBE_PAGE_FLAT = `${PROBE_PAGE_PREFIX}Beta`

/**
 * 探測用的分組色票檔名。
 *
 * 前綴從設定算出來,不寫死 —— 每個專案的色票檔叫什麼不一樣,
 * 寫死的話換一個專案這幾則驗證永遠不會命中,看起來像規則壞了。
 */
/**
 * 探測色票檔共同的開頭 —— 清除時靠它認出「這幾支是驗證自己建的」。
 *
 * 新增一支探測色票時沿用這個開頭,結束時就會被一起清掉,不必回頭補清除的清單。
 */
const PROBE_COLOR_PREFIX = `${COLOR_CSS_PREFIX}SelfTest`

const PROBE_COLOR_FILE = `${PROBE_COLOR_PREFIX}.css`

/**
 * 驗色票檔自身規則(命名、混用、值的形狀)時用的另一支探測色票。
 *
 * **不能與上面那支共用** —— 案例會實際把 code 寫進檔案,共用的話後面的案例
 * 會覆寫前面的內容,而「色票裡已經有這個色值」那類案例靠的正是那份內容。
 * 覆寫之後那則會失敗,但失敗的原因看起來像是規則壞了。
 */
const PROBE_COLOR_NAMING_FILE = `${PROBE_COLOR_PREFIX}Naming.css`

/**
 * 驗排序那一條時用的探測色票 —— 同樣要自己一支。
 *
 * 這支的內容是刻意沒排好的,與別的案例期待的內容相反;共用一支的話,
 * 兩邊會互相覆寫,而失敗的原因看起來像是規則壞了。
 */
const PROBE_COLOR_SORT_FILE = `${PROBE_COLOR_PREFIX}Sort.css`

/**
 * 探測用的樣式設定檔 —— 擺在專案根,因為那條規則只看專案根的設定檔。
 *
 * 注意:**不能用專案真正的 tailwind 設定檔名** —— 案例會實際寫入內容,
 *    用真名就會把專案的設定整份蓋掉。名字取得夠特別,誤留下來一眼看得出是什麼。
 */
const BUILD_STYLE_CONFIG = `${PROBE}.config.js`

/** 探測用的 theme 值來源檔 —— 值常常另外拆一支檔案再 import 進設定 */
const THEME_SOURCE_FILE = `${PROBE}.theme.js`

/**
 * 依每一組的比對式,造一個一定會落在那一組的 import 路徑。
 *
 * 比對式的形狀只處理三種常見寫法:開頭(`^…`)、結尾(`…$`)、包含。
 * 造出來之後一定要用規則自己的分組函式確認 —— 造錯了就退回不驗那一則,
 * 而不是拿一個分錯組的探針去跑(那樣驗到的會是另一條路徑,結果卻看似通過)。
 */
const sampleSpecOf = (match) => {
  const body = match.replace(/\\/g, '')

  if (body.startsWith('^')) return `${body.slice(1)}probeSample.js`
  if (body.endsWith('$')) return `probeSample${body.slice(0, -1)}`

  return `probeSample/${body}probeSample.js`
}

/**
 * 一份「照設定的順序排好」的 import 清單,每一組各一行,最後補一行「其他」。
 *
 * 造不出正確分組的那一組會被略過 —— 寧可少驗一組,也不要用分錯組的探針。
 */
const orderedImportsOf = () => {
  const lines = []

  IMPORT_ORDER_GROUPS.forEach((group, index) => {
    const spec = sampleSpecOf(group.match)
    if (importGroupOf(spec) !== index) return

    lines.push(`import '${spec}'`)
  })

  // 「其他」那一組:不符合任何一條比對式的路徑
  const other = 'vue'
  if (importGroupOf(other) === IMPORT_ORDER_GROUPS.length) {
    lines.push(`import { computed } from '${other}'`)
  }

  return lines
}

/**
 * 探針裡要寫的「專案名稱」—— 從設定取,不寫死。
 *
 * 那條規則抓的是 PROJECT_NAMES 裡的名字,每個專案不一樣。探針寫死一個名字的話,
 * 案例搬到別的專案就抓不到任何東西,看起來像規則失效,其實是探針寫錯了名字。
 *
 * 空白去掉,模擬「連在一起寫」那種最常見的形狀(網域、資料夾名都是這樣寫的)。
 * 規則組出來的比對式涵蓋空白、底線、連字號與連寫,所以這一種一定命中。
 */
const PROBE_PROJECT_SLUG = (PROJECT_NAMES[0] ?? '').replace(/\s+/g, '')

/** `common` → `Common` —— 從設定值組出 store 名稱時要用 */
const pascalOf = (name) => name.charAt(0).toUpperCase() + name.slice(1)

/**
 * 「別的工具帶 --write 執行」那一則要用的探測檔。
 *
 * 放在系統的暫存目錄,不放專案裡 —— 這一則不靠路徑決定跑哪些檢查
 * (其他探測檔要靠),而放在規則那一層的話,它存在的那一瞬間會被算進指紋,
 * 剛好就是這一則要驗的東西。位置由系統給,不寫死任何一台機器的路徑。
 */
const PROBE_WRITE_FILE = path.join(os.tmpdir(), `${PROBE}-write.mjs`)

/** 探測用的色值與變數名 —— 用不太可能撞到的值,避免與專案既有色票重複 */
const PROBE_COLOR_VAR = '--gray-4d2c'
const PROBE_COLOR_HEX = '#4d2c1e'

/**
 * 「色票值引用別的變數」那一則要用的基礎色與它轉換後的樣子。
 *
 * 基礎色取探測色票自己就有的那一支 —— 規則查基礎色查的是色票目錄掃出來的
 * 那一份,不是案例內容裡寫了什麼。借用專案色票裡剛好有的名字(例如 `--black`)
 * 的話,案例在沒有那支變數的專案必定失敗,而訊息是「預期會轉換,實際沒有變動」,
 * 看起來像規則壞了 —— 實際上是案例綁死了某一種色票命名。
 *
 * 轉換後的色值與名字都用規則自己的算法推,不寫死:透明度怎麼接成後綴是設定,
 * 寫死一種的話,另一種慣例的專案會過不了。
 */
const PROBE_REF_ALPHA = '0.3'
const PROBE_REF_HEX = withAlpha(PROBE_COLOR_HEX, PROBE_REF_ALPHA)
const PROBE_REF_VAR = `--${hueOf(PROBE_COLOR_VAR, PROBE_REF_HEX, 'name')}${COLOR_NAME_SEPARATOR}${expectedSuffix(PROBE_REF_HEX)}`

/**
 * 帶透明度的探測色,以及它在**目前設定下**應該叫什麼。
 *
 * 名字用 expectedSuffix 算,不寫死 —— 透明度那兩碼怎麼接是設定
 * (COLOR_SUFFIX_PICK.alphaSeparator),直接相接的專案得到 `--gray-e566`,
 * 用分隔符的專案得到 `--gray-e5-66`。寫死一種的話,案例在另一種慣例的專案
 * 會過不了,而那不是規則壞了,是案例綁死了設定。
 */
const PROBE_ALPHA_HEX = '#e5e5e566'
const PROBE_ALPHA_HUE = 'gray'
const PROBE_ALPHA_SUFFIX = expectedSuffix(PROBE_ALPHA_HEX)
const PROBE_ALPHA_VAR = `--${PROBE_ALPHA_HUE}${COLOR_NAME_SEPARATOR}${PROBE_ALPHA_SUFFIX}`

/**
 * 同樣長度、但每一碼都不同的取碼 —— 驗「取碼位置不同只給建議」那條路徑。
 *
 * **只位移後綴,色相名原樣留著** —— 色相名裡也有 hex 字元(gray 的 a),
 * 連它一起換的話會變成認不出的色相,那則案例就跑到別條規則去了。
 *
 * 分隔符也不動,長度才會與正確的名字一致 ——
 * 長度一旦不同就會走到「形狀對不上」那條路徑,那是別則案例在驗的事。
 */
const HEX_DIGITS = '0123456789abcdef'

const PROBE_ALPHA_SHIFTED =
  `--${PROBE_ALPHA_HUE}${COLOR_NAME_SEPARATOR}` +
  PROBE_ALPHA_SUFFIX.replace(
    /[0-9a-f]/g,
    (c) => HEX_DIGITS[(HEX_DIGITS.indexOf(c) + 1) % HEX_DIGITS.length]
  )

/** 這次執行自己建立的東西,結束時只刪這些 */
const created = []

const onCreateIfMissing = (rel, content = null) => {
  const abs = path.join(root, rel)
  if (fs.existsSync(abs)) return

  if (content === null) {
    fs.mkdirSync(abs, { recursive: true })
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf8')
  }

  created.push(abs)
}

/**
 * 開一個探測用的目錄,而且**只開自己的** —— 那裡已經有東西就不動它,回傳 null。
 *
 * 驗證會建東西再刪掉,而刪的那一步沒有辦法分辨「這是我剛建的」與
 * 「這本來就在」。目錄已存在時 `mkdirSync` 不會有任何反應(遞迴建立本來就
 * 允許已存在),於是刪的時候把別人的東西一起帶走 —— 專案真正的程式碼消失,
 * 而驗證照常顯示全部通過,沒有任何訊息。
 *
 * 所以規矩是:**自己建得起來才繼續,建不起來就跳過那一則。**
 * 少驗一則會被寫進「這次跳過了哪幾則」,刪掉別人的檔案則沒有人會知道。
 */
const makeProbeDir = (abs) => {
  if (fs.existsSync(abs)) return null

  fs.mkdirSync(abs, { recursive: true })
  return abs
}

/** 規則要比對的對象 —— 頁面資料夾、色票、建置設定 */
const onPrepare = () => {
  onCreateIfMissing(viewResourceDir(PROBE_PAGE_ALPHA))
  onCreateIfMissing(viewResourceDir(PROBE_PAGE_PLURAL))
  onCreateIfMissing(viewResourceDir(PROBE_PAGE_FLAT))

  /* store 的分層規則比對的是「有向後端要資料的頁面」,所以探測用的頁面群裡
     要有一支會呼叫 action 的頁面檔,否則那條規則沒有東西可以比對。

     刻意擺在子資料夾底下 —— 分類資料夾不佔一層,層名要取頁面檔名(detail),
     不是資料夾名。放在第一層的話驗不出這件事。 */
  const probePage = `<script setup>\nonApiSelfTestProbe()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`

  onCreateIfMissing(
    `${viewResourceDir(PROBE_PAGE_ALPHA)}/${PROBE_PAGE_SUB_FOLDER}/${PROBE_PAGE_FILE}`,
    probePage
  )

  /* 第二個頁面群裡放兩支同名的頁面,分別在兩個分類資料夾底下 ——
     撞名時分類資料夾要補回來當一層,不撞的維持扁平,兩種都要驗得到。 */
  onCreateIfMissing(
    `${viewResourceDir(PROBE_PAGE_PLURAL)}/${PROBE_CLASH_FOLDER_A}/${PROBE_PAGE_FILE}`,
    probePage
  )
  onCreateIfMissing(
    `${viewResourceDir(PROBE_PAGE_PLURAL)}/${PROBE_CLASH_FOLDER_B}/${PROBE_PAGE_FILE}`,
    probePage
  )

  /* 探測用的元件 —— 「這支樣式屬於哪一個元件」那條規則要拿樣式的名字
     與實際存在的元件比對,所以元件本身要先在那裡。

     元件資料夾裡一定要有 `.vue`:規則就是靠這件事分辨「元件」與
     「只把元件分類起來的那一層」,只建空資料夾的話兩者長得一模一樣。

     一支放在元件目錄第一層,一支放在分類層底下,兩種擺法各驗得到。 */
  /* class 跟著自己的資料夾名走(`mCssSelfTest` → `.m-css-self-test`)——
     探測元件也要是合規的元件。寫成一個通用的 class 的話,
     「這支樣式掛在哪一支元件身上」那種反查會把每一支用同名 class 的樣式
     都指向這裡,而那是測試環境自己造成的,不是規則判錯。 */
  const probeComponentOf = (folder) =>
    `<template>\n  <div class="${classPrefixOf(folder)}"></div>\n</template>\n`

  onCreateIfMissing(`${SC}/Index.vue`, probeComponentOf(PROBE_MODULE))
  onCreateIfMissing(`${GC}/${PROBE_NESTED_MODULE}/Index.vue`, probeComponentOf(PROBE_NESTED_MODULE))

  onCreateIfMissing(
    `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    `:root {\n  ${PROBE_COLOR_VAR}: ${PROBE_COLOR_HEX};\n}\n`
  )

  /* 建置設定:「離開自己資料夾要用 alias」那條規則直接讀它,取得專案有哪些 alias。
     專案已經有建置設定的話完全不碰 —— 覆蓋掉別人的建置設定會是很嚴重的破壞。

     檔名取候選清單的第一個、alias 指向的位置也全部從設定算 ——
     這份最小設定要與這個專案的目錄擺法一致,驗證才驗得到真正在用的東西。 */
  onCreateIfMissing(
    BUILD_CONFIG_FILES[0],
    `export default {\n` +
      `  resolve: {\n` +
      `    alias: {\n` +
      `      '@': '${SRC_DIR}',\n` +
      `      '@components': '${COMPONENTS_DIR}',\n` +
      `      '@stores': '${STORE_DIR}',\n` +
      `      '@api': '${API_DIR}',\n` +
      `    },\n` +
      `  },\n` +
      `}\n`
  )
}

/**
 * 造一則「用到被 tailwind 整組覆寫掉的 class」的案例。
 *
 * 取設定裡那一類第一個消失的值來造內容:斷點寫成 `值:`,其餘寫成 `前綴值`
 * (例如字級是 `text-sm`、陰影是 `shadow-md`)。
 *
 * **這個專案有沒有整組覆寫那一類,決定同一段內容該不該被報。**
 * 設定列的是「tailwind 有哪幾類」,與專案無關 —— 每個專案都會拿到整份清單,
 * 但只有自己真的覆寫掉的那幾類才該提醒。所以沒覆寫時改成驗「不報」,
 * 而且探針照樣用那個內建值:用一個不存在的名字的話,
 * 驗到的只是「規則不會無中生有」,驗不到「沒覆寫就不該報」。
 *
 * 判斷取規則讀的那一份(tailwindThemeOf)—— 這裡自己再判一次的話,
 * 規則改了條件而驗證沒跟上,這幾則會開始亂報。
 */
/**
 * 驗「這個專案實際有的 class 不會被誤報成已消失」。
 *
 * 值從 tailwind 設定讀出來,不寫死 —— 每個專案 theme 定義的值都不一樣,
 * 寫死一個值的話,沒有那個值的專案會被報「用到已消失的 class」,
 * 看起來像規則壞了,其實是探針用了別的專案才有的名字。
 *
 * 挑的是「有列在覆寫清單裡、而且實際上定義了值」的那一類 ——
 * 這兩個條件都成立才驗得到「規則分得出存在與消失」。
 * 一類都找不到時退化成一段沒有 tailwind class 的樣式,確認規則不會無中生有。
 */
const aliveThemeCaseOf = (file) => {
  const theme = tailwindThemeOf(root)

  for (const [key, group] of Object.entries(TAILWIND_THEME_OVERRIDES)) {
    // 斷點的寫法是 `斷點:class`,與其他類別的前綴形式不同,這裡只取有前綴的
    if (!group.prefix) continue

    const alive = (theme?.[key] ?? []).find((v) => !group.dead.includes(v))
    if (!alive) continue

    return {
      name: `theme ${key} 實際定義的值不誤報`,
      rule: 'theme',
      file,
      code: `.m-probe {\n  @apply ${group.prefix}${alive};\n}`,
      expect: 0,
    }
  }

  return {
    name: 'theme 沒有可用的值時不會無中生有',
    file,
    code: `.m-probe {\n  color: var(--black);\n}`,
    expect: 0,
  }
}

const themeCaseOf = (key, file, codeOf) => {
  const group = TAILWIND_THEME_OVERRIDES[key]
  const [dead] = group?.dead ?? []

  if (!dead) {
    return {
      name: `theme ${key} 沒有列出任何內建值時不誤報`,
      rule: 'theme',
      file,
      code: codeOf(group?.prefix ? `${group.prefix}self-test-none` : 'selfTestNone:'),
      expect: 0,
    }
  }

  const cls = group.prefix ? `${group.prefix}${dead}` : `${dead}:`

  /* 這個專案沒有整組覆寫這一類 —— 那些內建值都還在,用了不是違規。
     報出來的話,每一支用到它的檔案都會被指著說「不存在」,
     而訊息還會寫「已整組覆寫」,那句話在這個專案是假的。 */
  if (!(key in tailwindThemeOf(root))) {
    return {
      name: `theme 這個專案沒有整組覆寫${group.label}時,用內建值不算違規`,
      rule: 'theme',
      file,
      code: codeOf(cls),
      expect: 0,
    }
  }

  return {
    name: `theme 已被覆寫掉的${group.label}`,
    rule: 'theme',
    file,
    code: codeOf(cls),
    expect: 1,
    keyword: key,
  }
}

/* 前提要在案例定義之前就建好 —— 有幾個案例的內容是照專案現況算出來的
   (例如「這個專案的 api 目錄該用哪一個 alias」)。
   案例先算、前提後建的話,算出來的會是「當時還沒有」的結果,
   那幾則驗證就永遠不會命中,而且看起來像規則壞了。 */
onPrepare()

/** 指到 api 目錄的 alias 寫法 —— 元件與頁面的 import 檢查都用它造資料 */
const API_ALIAS_IMPORT = apiAliasImportOf('member.js') ?? apiImportPathOf(P, 'member.js')

/**
 * 每個案例:
 *   file     探測檔的相對路徑(決定哪些檢查會跑)
 *   code     檔案內容
 *   expect   預期抓到幾筆
 *   keyword  訊息裡必須出現的關鍵字 —— 確認抓到的是「這條」而不是碰巧被別條抓到
 *
 * 案例分成兩份:這一份是**樣式規範**(色票、tailwind、模組 css、變數),
 * 下面那份 RULE_CASES 是**結構規範**(api、store、頁面、import、全站)。
 * 兩份的差別在於綁不綁專案 —— 樣式那幾條依賴各專案自己的色票位置與
 * tailwind 覆寫,換專案要跟著換;結構那幾條只依賴目錄設定,可以整段搬。
 */
/**
 * 「級距要在每個斷點列齊前綴」那幾則案例。
 *
 * 內容從設定組出來(哪個 `@screen` 要列哪幾種前綴),不寫死斷點名 ——
 * 各專案的斷點叫什麼都不一樣,寫死的話那種專案永遠驗不到東西,
 * 而失敗的訊息看起來像規則壞了。
 *
 * 沒有分斷點的專案(設定是空物件)回空陣列,那幾則跳過並說明原因。
 */
const breakpointPrefixCases = () => {
  const [screen, prefixes] = Object.entries(BREAKPOINT_SCREENS)[0] ?? []
  if (!screen || prefixes.length < 2) return []

  const scale = 'px-20'
  const selector = (list) => list.map((p) => `    &.${p ? `${p}\\:` : ''}\\-\\-${scale},`).join('\n')

  /* 母體 class 用探測元件的名字 —— 模組 css 只能寫自己那組 class,
     用別的名字會同時命中那一條,案例就分不出抓到的是哪一條。 */
  const block = (list) =>
    `@screen ${screen} {\n  .m-css-self-test {\n${selector(list).replace(/,$/, ' {')}\n` +
    `      --probe-px: 20px;\n    }\n  }\n}\n`

  return [
    {
      name: 'breakpointPrefix 少列一種前綴要報',
      file: `${S}/probeBreakpointShort.css`,
      code: block(['', prefixes[0]]),
      expect: 1,
      rule: 'breakpointPrefix',
      keyword: prefixes[prefixes.length - 1],
    },
    {
      name: 'breakpointPrefix 列齊了不誤報',
      file: `${S}/probeBreakpointFull.css`,
      code: block(['', ...prefixes]),
      expect: 0,
      rule: 'breakpointPrefix',
    },
    {
      /* 從來沒帶過前綴的名字是元件自己的變體(尺寸、狀態),
         使用端不會在它前面加斷點前綴,要求列出變體是誤報。 */
      name: 'breakpointPrefix 沒帶過前綴的變體不受這條約束',
      file: `${S}/probeBreakpointVariant.css`,
      code:
        `@screen ${screen} {\n  .m-css-self-test {\n    &.\\-\\-size-md {\n` +
        `      --probe-px: 20px;\n    }\n  }\n}\n`,
      expect: 0,
      rule: 'breakpointPrefix',
    },
  ]
}

const CSS_CASES = [
  // ---------- 規則 color ----------
  {
    name: 'color 硬寫 hex',
    file: `${M}/a.css`,
    code: `.m-probe {\n  color: #333;\n}`,
    expect: 1,
    keyword: '硬寫色碼',
  },
  {
    name: 'color 硬寫 rgba 數值',
    file: `${M}/b.css`,
    code: `.m-probe {\n  background: rgba(0, 0, 0, 0.4);\n}`,
    expect: 1,
    keyword: '8 碼 hex',
  },
  {
    /* hexToRgb() 與 -rgb 衍生變數是同一條廢除鏈的兩端:前者產生後者。
       這一條報出來讓人決定新變數叫什麼、放哪一支色票,不自動轉。 */
    name: 'color hexToRgb() 要報違規',
    file: `${M}/rgb1.css`,
    code: `.m-probe {\n  color: hexToRgb(#000);\n}`,
    expect: 1,
    keyword: 'hexToRgb() 已不使用',
  },
  {
    name: 'colorFile -rgb 衍生變數要報違規',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* gray */\n  --gray-9e: #9e9e9e;\n  --gray-9e-rgb: hexToRgb(#9e9e9e);\n}\n`,
    expect: 1,
    keyword: '已廢除的 rgb 衍生變數',
  },
  {
    /* 值不是色碼的話,取碼命名算不出結果,那一筆的命名檢查會整個被跳過 ——
       不報的話,寫成 rgba() 就等於讓那一筆從此不受任何檢查。 */
    name: 'colorFile 值寫成 rgba() 要報違規',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* black */\n  --black-30: rgba(#000, 0.3);\n}\n`,
    expect: 1,
    keyword: '不是單純的色碼',
  },
  {
    /* 排序走自己的代號 —— 它存檔就自動修好了,與「要人動手改」的命名、值那幾條
       性質相反。混在同一個代號底下的話,看到一串違規分不出哪幾筆該處理。 */
    name: 'colorSort 排序不符走自己的代號',
    rule: 'colorSort',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_SORT_FILE}`,
    code: `:root {\n  --black: #000000;\n  --white: #ffffff;\n}\n`,
    expect: 1,
    keyword: '排序不符規則',
  },
  {
    /* 只計 colorFile —— 排序走自己的代號(colorSort),而探針的順序符不符合
       會隨 COLOR_HUE_SOURCE 而異(語意命名時色相從色值算,算不出 hex 的排最後)。
       不指定的話,這則在語意命名的專案會被排序那一筆撞到。 */
    name: 'colorFile 值寫成 var() 要報違規',
    rule: 'colorFile',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* black */\n  --black-x: var(--black);\n}\n`,
    expect: 1,
    keyword: '不是單純的色碼',
  },
  {
    name: 'colorFile 純色碼不誤報',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* black */\n  --black: #000;\n  --black-b3: #000000b3;\n}\n`,
    expect: 0,
  },
  {
    /* 只計 color —— 探針用的是不存在的變數名,「引用不到定義」那條會另外報,
       而這則要驗的是「用了變數就不算硬寫色碼」。 */
    name: 'color 用變數不誤報',
    rule: 'color',
    file: `${M}/c.css`,
    code: `.m-probe {\n  color: var(--gray-333);\n  background: rgba(var(--white-rgb), 0.4);\n}`,
    expect: 0,
  },
  {
    /* 用探測色票裡的色值,不用專案既有的 ——
       案例要驗的是「色票裡有這個色值時,訊息會把變數名寫出來」,
       綁定專案的某一支色票會讓這個案例在別的專案失效。 */
    name: 'color 已有色票時提示變數名',
    file: `${M}/d.css`,
    code: `.m-probe {\n  color: ${PROBE_COLOR_HEX};\n}`,
    expect: 1,
    keyword: PROBE_COLOR_VAR,
  },
  {
    // 同時違反兩條:硬寫色碼(color)與 components 不得用 utility(tailwind)
    rule: 'color',
    name: 'color .vue 的 template arbitrary value',
    file: `${C}/Probe.vue`,
    code: `<template>\n  <div class="text-[#333]"></div>\n</template>\n`,
    expect: 1,
    keyword: 'arbitrary',
  },
  {
    rule: 'color',
    name: 'color .vue 的 script 不擋(送外部平台的色值)',
    file: `${C}/Probe2.vue`,
    code: `<script setup>\nconst flex = { color: '#ffffff' }\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 colorFile ----------
  {
    /* 名字從設定算出來,不寫死 —— 取碼規則(COLOR_SUFFIX_PICK)每個專案不一樣,
       透明度那兩碼有的直接接、有的用分隔符隔開。寫死一種的話,
       案例搬到另一種慣例的專案就過不了,看起來像規則壞了,其實是案例綁死了設定。 */
    name: 'colorFile 取碼符合命名規則不報',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  ${PROBE_ALPHA_VAR}: ${PROBE_ALPHA_HEX};\n}\n`,
    expect: 0,
  },
  {
    /* 形狀對不上(長度不同)——多半是專案的命名慣例與設定不同,
       例如透明度那兩碼用分隔符隔開。這種一定要報:
       不報的話,整個專案的那一類命名從此不被檢查,而畫面上看起來是全部通過。 */
    name: 'colorFile 取碼形狀對不上要報並指向設定',
    needs: 'suffixNaming',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  ${PROBE_ALPHA_VAR}x: ${PROBE_ALPHA_HEX};\n}\n`,
    expect: 1,
    keyword: 'COLOR_SUFFIX_PICK',
  },
  {
    /* 長度相同、取碼位置不同 —— 規範允許為了避開同色系撞碼而微調,
       所以給建議值,不斷定是錯的。與上面那則的差別就在長度。 */
    name: 'colorFile 取碼位置不同只給建議',
    needs: 'suffixNaming',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  ${PROBE_ALPHA_SHIFTED}: ${PROBE_ALPHA_HEX};\n}\n`,
    expect: 1,
    keyword: '建議',
  },
  {
    name: 'colorFile 語意名沒有取碼後綴,不報',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* white */\n  --white: #fff;\n}\n`,
    expect: 0,
  },
  {
    /* 一份色票只能用一種命名方式。兩種的分類來源不同 ——
       帶色相的名字是人做過的判斷,語意名只能從色值算 ——
       混在一起排出來的順序就沒有一致的依據。 */
    name: 'colorFile 混用兩種命名方式要報',
    rule: 'colorFile',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  --gray-9e: #9e9e9e;\n  --btn-hover: #c20016;\n}\n`,
    /* 混用那一筆一定有;取碼命名那條只在「名字帶色相」的專案跑,
       語意名的那個變數在那種專案會多被報一次「認不出色相」。
       期待值跟著設定算,不寫死其中一種專案的數字。 */
    expect: isSuffixNamingChecked ? 2 : 1,
    keyword: '混了兩種命名方式',
  },
  {
    name: 'colorFile 全部都是帶色相的名字,不算混用',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* gray */\n  --gray-9e: #9e9e9e;\n}\n`,
    expect: 0,
  },
  {
    /* 期待的是「訊息把可用的色相列出來」,所以比對整份清單,不挑其中一個字 ——
       色相清單是設定,每個專案不一樣;挑一個字寫死的話,配色不含那一色的專案
       會比對不到,而規則本身是對的。 */
    name: 'colorFile 認不出色相時列出可用的色相',
    needs: 'suffixNaming',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* other */\n  --brand-e566: #e5e5e566;\n}\n`,
    expect: 1,
    keyword: HUE_LIST_TEXT,
  },

  // ---------- 被註解掉的內容一律不算違規 ----------
  //
  // 註解掉的程式碼是死的,它不產生任何樣式。拿規範去檢查它會讓人以為某一行有問題,
  // 打開檔案才發現那一段根本沒有作用 —— 而真正要修的那幾筆就被這種訊息蓋住了。
  //
  // 每一條檢查 css 內容的規則都要驗一次:遮蔽是各規則自己呼叫的,
  // 漏掉哪一條,那一條就會繼續誤報,而且不會有任何徵兆。
  {
    name: '註解:硬寫色碼在 css 註解裡不算違規',
    file: `${M}/comment1.css`,
    code: `.m-probe {\n  /* color: #123456; */\n}\n`,
    expect: 0,
  },
  {
    rule: 'color',
    name: '註解:硬寫色碼在 .vue 的 style 註解裡不算違規',
    file: `${C}/Comment1.vue`,
    code: `<template>\n  <div class="m-probe"></div>\n</template>\n\n<style>\n.m-probe {\n  /* color: #123456; */\n}\n</style>\n`,
    expect: 0,
  },
  {
    name: '註解:尺寸縮寫在 css 註解裡不算違規',
    file: `${M}/comment2.css`,
    code: `.m-probe {\n  /* &.\\-\\-size-md {\n    color: red;\n  } */\n}\n`,
    expect: 0,
  },
  {
    /* 註解的起始符號在自己那一行時,逐行判斷「這一行是不是註解」會漏掉中間幾行。
       整段遮蔽才擋得住。 */
    name: '註解:多行註解裡的別組 class 不算違規',
    file: `${M}/comment3.css`,
    code: `.m-probe {\n  color: red;\n}\n\n/*\n.m-other {\n  color: red;\n}\n*/\n`,
    expect: 0,
  },
  {
    name: '註解:沒有被註解的違規照樣要報',
    file: `${M}/comment4.css`,
    code: `.m-probe {\n  /* 這行是說明 */\n  color: #123456;\n}\n`,
    expect: 1,
    keyword: '硬寫色碼',
  },
  {
    /* 豁免標記本身寫在註解裡 —— 先遮蔽再找的話,標記也被抹掉,
       規則會從「不報」變成「開始報」,方向完全相反。 */
    name: '註解:斷點豁免標記仍然讀得到',
    needs: 'breakpoints',
    file: `${M}/variables.css`,
    code: `/* lint-breakpoint-exempt: 每個斷點的值相同 */\n:root {\n  --probe-${BREAKPOINTS[0]}-px: 10px;\n}\n`,
    expect: 0,
  },

  // ---------- 規則 truncateClass ----------
  {
    rule: 'truncateClass',
    name: 'truncateClass @apply 用了 truncate',
    file: `${M}/truncate1.css`,
    code: `.m-probe {\n  @apply truncate;\n}\n`,
    expect: 0,
    expectWarn: 1,
    keyword: 'line-clamp-1',
  },
  {
    rule: 'truncateClass',
    name: 'truncateClass line-clamp-1 不報',
    file: `${M}/truncate2.css`,
    code: `.m-probe {\n  @apply line-clamp-1;\n}\n`,
    expect: 0,
    expectWarn: 0,
  },
  {
    rule: 'truncateClass',
    name: 'truncateClass 帶斷點前綴一樣要報',
    file: `${M}/truncate3.css`,
    code: `@screen ${BREAKPOINTS[0]} {\n  .m-probe {\n    @apply p:truncate;\n  }\n}\n`,
    expect: 0,
    expectWarn: 1,
  },
  {
    rule: 'truncateClass',
    name: 'truncateClass 畫面區段的 class 也要報',
    file: `${C}/Truncate1.vue`,
    code: `<template>\n  <div class="m-probe truncate"></div>\n</template>\n`,
    expect: 0,
    expectWarn: 1,
  },
  {
    /* 「要截幾行」正是靠一個叫 truncate 的 prop 傳進來的 ——
       動態綁定裡的變數名算進來的話,正確的寫法會被報成違規。 */
    rule: 'truncateClass',
    name: 'truncateClass 動態綁定的變數名不算',
    file: `${C}/Truncate2.vue`,
    code: `<template>\n  <div class="m-probe" :class="truncate"></div>\n</template>\n`,
    expect: 0,
    expectWarn: 0,
  },

  // ---------- 規則 tailwind ----------
  {
    rule: 'tailwind',
    name: 'tailwind template 靜態 class',
    file: `${C}/Tw1.vue`,
    code: `<template>\n  <div class="m-probe flex items-center"></div>\n</template>\n`,
    expect: 2,
    keyword: 'tailwind class',
  },
  {
    rule: 'tailwind',
    name: 'tailwind 組件 class 與 --modifier 不誤報',
    file: `${C}/Tw2.vue`,
    code: `<template>\n  <div class="m-probe --px-15 p:--px-24 jFormValid"></div>\n</template>\n`,
    expect: 0,
  },
  {
    rule: 'tailwind',
    name: 'tailwind variant 前綴要剝掉再判定',
    file: `${C}/Tw3.vue`,
    code: `<template>\n  <div class="p:flex hover:bg-[--white]"></div>\n</template>\n`,
    expect: 2,
    keyword: 'tailwind class',
  },
  {
    rule: 'tailwind',
    name: 'tailwind 動態綁定只取引號內的字面 class',
    file: `${C}/Tw4.vue`,
    code: `<template>\n  <div :class="[setClass.main, { 'shrink-0': isFixed }]"></div>\n</template>\n`,
    expect: 1,
    keyword: 'shrink-0',
  },
  {
    rule: 'tailwind',
    name: 'tailwind 被註解掉的 template 不算違規',
    file: `${C}/Tw5.vue`,
    code: `<template>\n  <!-- <div class="flex"></div> -->\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    rule: 'tailwind',
    name: 'tailwind 同一個 class 只報一次',
    file: `${C}/Tw6.vue`,
    code: `<template>\n  <div class="flex">\n    <span class="flex"></span>\n  </div>\n</template>\n`,
    expect: 1,
  },
  {
    name: 'tailwind 只管 components,其他目錄不報',
    file: `${M}/NotComponent.vue`,
    code: `<template>\n  <div class="flex items-center"></div>\n</template>\n`,
    expect: 0,
  },
  {
    rule: 'tailwind',
    name: 'tailwind <style> 內的 class 不算 template',
    file: `${C}/Tw7.vue`,
    code: `<template>\n  <div class="m-probe"></div>\n</template>\n\n<style>\n.m-probe {\n  @apply flex items-center;\n}\n</style>\n`,
    expect: 0,
  },

  // ---------- 規則 theme ----------
  /* 三則案例的內容都從設定算出來(TAILWIND_THEME_OVERRIDES)——
     哪幾類被 tailwind 整組覆寫、覆寫後哪些值消失,每個專案都不一樣。
     寫死某個值的話,沒有覆寫那一類的專案會驗不出結果,看起來像規則壞了;
     而那種專案「不報」才是正確行為。

     所以沒有列出任何消失的值時,案例就改成驗「不報」—— 用一個一定不會命中的
     class 名稱,確認規則在那種專案不會誤報。 */
  themeCaseOf('screens', `${C}/Theme1.vue`, (cls) =>
    `<template>\n  <div class="m-probe ${cls}m-probe-wide"></div>\n</template>\n`
  ),
  themeCaseOf('fontSize', `${M}/theme2.css`, (cls) => `.m-probe {\n  @apply ${cls};\n}`),
  themeCaseOf('boxShadow', `${M}/theme3.css`, (cls) => `.m-probe {\n  @apply ${cls};\n}`),
  themeCaseOf('fontFamily', `${M}/theme7.css`, (cls) => `.m-probe {\n  @apply ${cls};\n}`),
  aliveThemeCaseOf(`${M}/theme4.css`),
  {
    /* 變數自己定義、自己引用 —— 不借用專案的色票。
       借用的話,那個名字在別的專案不存在:「引用不到定義」那條會報一筆,
       而這則看起來像規則壞了,實際上錯的是案例。 */
    name: 'theme 色票變數名內含 sm/md 不誤報',
    file: `${M}/theme5.css`,
    code: `.m-probe {\n  --probe-sm-size: 10px;\n  --probe-md-size: 10px;\n  @apply text-[--probe-sm-size];\n}`,
    expect: 0,
  },
  {
    rule: 'theme',
    name: 'theme .vue 的 script 不掃',
    file: `${C}/Theme6.vue`,
    code: `<script setup>\nconst size = 'text-sm'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 註解裡舉例寫出一個已經消失的 class 是正常的 ——
       「這裡不要再用它」那句說明本身就含有那個名字,
       報出來的那一筆沒有人能修:照著改等於把說明改壞。 */
    name: 'theme 程式的行註解裡舉例不算違規',
    file: `${A}/probeThemeComment.js`,
    code: `export const isVariant = (c) => /:/.test(c) // 例如 text-sm 這種前綴寫法\n`,
    expect: 0,
    rule: 'theme',
  },
  {
    name: 'theme 樣式的註解裡舉例不算違規',
    file: `${M}/probeThemeComment.css`,
    code: `/* 這裡不要再用 text-sm */\n.m-probe {\n  @apply flex;\n}\n`,
    expect: 0,
    rule: 'theme',
  },
  {
    /* 網址裡的兩條斜線不是註解的起頭。當成註解遮掉的話,那一行後半段
       (常常還有真正要檢查的程式碼)會一起消失,而漏掉的違規不會有人發現。 */
    name: 'theme 網址裡的斜線不算註解,同一行的 class 照樣抓',
    file: `${A}/probeThemeUrl.js`,
    code: `export const cls = { url: 'https://example.com/x', size: 'text-sm' }\n`,
    expect: 1,
    rule: 'theme',
    keyword: 'text-sm',
  },

  // ---------- 規則 moduleOrder ----------
  {
    name: 'moduleOrder 變數檔排在版型檔後面',
    rule: 'moduleOrder',
    file: `${C}/Order1.vue`,
    code: `<script setup>\nimport '@css/_modules/mProbe/common.css'\nimport '@css/_modules/mProbe/variables.css'\n</script>\n`,
    expect: 1,
    keyword: '變數要全部先定義完',
  },
  {
    name: 'moduleOrder 正確順序不誤報',
    rule: 'moduleOrder',
    file: `${C}/Order2.vue`,
    code: `<script setup>\nimport '@css/_modules/mProbe/variables.css'\nimport '@css/_modules/mProbe/inputVariables.css'\nimport '@css/_modules/mProbe/common.css'\nimport '@css/_modules/mProbe/input.css'\n</script>\n`,
    expect: 0,
  },

  // ---------- 規則 variable ----------
  {
    name: 'variable 命名用全名而非縮寫',
    file: `${M}/naming.css`,
    code: `:root {\n  --probe-width: 10px;\n  --probe-padding: 5px;\n}`,
    expect: 2,
    keyword: '-w',
  },
  {
    name: 'variable 縮寫命名不誤報',
    file: `${M}/naming2.css`,
    code: `:root {\n  --probe-w: 10px;\n  --probe-p: 5px;\n  --probe-text-size: 14px;\n}`,
    expect: 0,
  },
  {
    /* 斷點名從設定取,不寫死 —— 每個專案的斷點叫什麼、有幾個都不一樣,
       寫死的話換一個命名的專案,這幾則驗到的是別人的斷點名。 */
    name: 'variable 斷點缺一份',
    needs: 'breakpoints',
    file: `${M}/bp1.css`,
    code: `:root {\n${breakpointVars('px', { skipLast: true })}\n}`,
    expect: 1,
    keyword: `--probe-${BREAKPOINTS.at(-1)}-px`,
  },
  {
    name: 'variable 斷點成套不誤報',
    needs: 'breakpoints',
    file: `${M}/bp2.css`,
    code: `:root {\n${breakpointVars('px')}\n}`,
    expect: 0,
  },
  {
    name: 'variable 標了例外註解就放行',
    needs: 'breakpoints',
    file: `${M}/bp3.css`,
    code: `/* lint-breakpoint-exempt: 只有桌機版有這個區塊 */\n:root {\n  --probe-${BREAKPOINTS[0]}-px: 24px;\n}`,
    expect: 0,
  },
  {
    /* 字級不吃這個標記:兩種字級都不需要它 —— 固定模組照規範分斷點就通過了,
       通用元件的字級本來就不該寫在元件裡。放行的話,那個標記會讓
       「還沒決定由誰定」看起來像「決定過了」。 */
    rule: 'variable',
    needs: 'breakpoints',
    name: 'variable 字級不吃豁免標記',
    file: `${M}/bp4Variables.css`,
    code: `/* lint-breakpoint-exempt: 三個斷點都一樣 */\n:root {\n  --probe-text-size: 16px;\n}`,
    expect: 1,
    keyword: '字級不吃豁免標記',
  },
  {
    /* 同一支檔案裡,非字級的那幾個照樣被標記放行 —— 這條收的只有字級。 */
    rule: 'variable',
    needs: 'breakpoints',
    name: 'variable 豁免對非字級仍然有效',
    file: `${M}/bp5Variables.css`,
    code: `/* lint-breakpoint-exempt: 只有桌機版有這個區塊 */\n:root {\n  --probe-px: 24px;\n  --probe-text-size: 16px;\n}`,
    expect: 1,
    keyword: '字級不吃豁免標記',
  },

  // ---------- 規則 variable:級距不用 sm / md / lg ----------
  {
    // 放 Variables 檔,才不會同時觸發 moduleVar(級距組歸屬)那條
    name: 'variable 級距用 md / sm 尺寸縮寫',
    file: `${M}/tshirtVariables.css`,
    code: `.m-probe {\n  &.\\-\\-size-md {\n    --probe-size: 40px;\n  }\n\n  &.\\-\\-size-sm {\n    --probe-size: 30px;\n  }\n}`,
    expect: 2,
    keyword: '實際數值',
  },
  {
    name: 'variable 級距用實際數值不誤報',
    file: `${M}/tshirt2Variables.css`,
    code: `.m-probe {\n  &.\\-\\-size-40 {\n    --probe-size: 40px;\n  }\n\n  &.\\-\\-size-30 {\n    --probe-size: 30px;\n  }\n}`,
    expect: 0,
  },
  {
    name: 'variable 命名對齊 tailwind(radius → rounded)',
    file: `${M}/naming3.css`,
    code: `:root {\n  --probe-radius: 10px;\n  --probe-line-height: 1.5;\n}`,
    expect: 2,
    keyword: 'rounded',
  },

  // ---------- 規則 variable:該分斷點卻沒分 ----------
  {
    name: 'variable 尺寸值沒分斷點',
    needs: 'breakpoints',
    file: `${M}/needVariables.css`,
    code: `:root {\n  --probe-h: 40px;\n}`,
    expect: 1,
    keyword: '沒有分斷點',
  },
  {
    /* 顏色用 currentColor,不借用專案的色票 —— 借用的話那個名字在別的專案
       不存在,「引用不到定義」那條會報一筆,而這則看起來像規則壞了。
       寫成色碼也不行:那會被「不要硬寫色碼」那條抓。 */
    name: 'variable 顏色與中性值不用分斷點',
    file: `${M}/need2Variables.css`,
    code: `:root {\n  --probe-color: currentColor;\n  --probe-px: 0;\n  --probe-h: auto;\n  --probe-z: 3;\n  --probe-leading: 1.5;\n  --probe-w: 100%;\n}`,
    expect: 0,
  },
  {
    name: 'variable 已分斷點不誤報',
    needs: 'breakpoints',
    file: `${M}/need3Variables.css`,
    code: `:root {\n${breakpointVars('h')}\n}`,
    expect: 0,
  },
  {
    name: 'variable 非 Variables 檔不做這條檢查',
    file: `${M}/need4.css`,
    code: `:root {\n  --probe-h: 40px;\n}`,
    expect: 0,
  },

  // ---------- 規則 moduleScope ----------
  {
    name: 'moduleScope 混入別的模組 class',
    file: `${S}/common.css`,
    code: `.m-css-self-test {\n  @apply flex;\n}\n\n.m-popup-title {\n  @apply block;\n}`,
    expect: 1,
    keyword: '別的模組',
  },
  {
    name: 'moduleScope 混入非 m- 開頭的 class',
    file: `${S}/scope2.css`,
    code: `.m-css-self-test {\n  @apply flex;\n}\n\n.l-body {\n  @apply block;\n}`,
    expect: 1,
    keyword: '不是 m- 開頭',
  },
  {
    name: 'moduleScope 自己的 class 與 modifier 不誤報',
    file: `${S}/scope3.css`,
    code: `.m-css-self-test {\n  &.\\-\\-active,\n  &.p\\:\\-\\-px-24 {\n    @apply flex;\n  }\n}\n\n.m-css-self-test-title {\n  @apply block;\n}`,
    expect: 0,
  },
  {
    /* 父層掛上關聯機制的 class,底下的元件才能對父層的 hover 有反應。
       那不是別的模組,是建置工具提供的掛勾 —— 報它的話,
       這種連動就沒有一種寫得出來的形狀。 */
    name: 'moduleScope 父層狀態的掛勾不算別的模組',
    file: `${S}/structural.css`,
    code: `.group:hover .m-css-self-test {\n  @apply flex;\n}\n\n.peer:checked ~ .m-css-self-test {\n  @apply block;\n}\n`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 具名的寫法是同一種東西,取斜線前那一段比對 */
    name: 'moduleScope 具名的掛勾也放行',
    file: `${S}/structuralNamed.css`,
    code: `.group\\/card:hover .m-css-self-test {\n  @apply flex;\n}\n`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 轉場的 class 名字跟著畫面區段的 name 走,收斂成模組前綴的話兩邊就對不上 ——
       而轉場失效不會報錯,只是動畫沒了。 */
    name: 'moduleScope 轉場的六個 class 放行',
    file: `${S}/transition.css`,
    code: `.fade-enter-active,\n.fade-leave-active {\n  @apply opacity-100;\n}\n\n.fade-enter-from,\n.fade-leave-to {\n  @apply opacity-0;\n}\n`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 只有那六個後綴放行 —— 名字開頭像轉場但後綴不對的照樣報。 */
    name: 'moduleScope 不是轉場後綴的照樣報',
    file: `${S}/transitionLike.css`,
    code: `.fade-enter-done {\n  @apply opacity-100;\n}\n`,
    expect: 1,
    rule: 'moduleScope',
  },
  {
    /* 放行的只有那兩個名字 —— 開頭長得像也不算,
       不然 `.grouped` 這種一般 class 會跟著被放過。 */
    name: 'moduleScope 名字開頭像掛勾但不是的照樣報',
    file: `${S}/structuralLike.css`,
    code: `.grouped .m-css-self-test {\n  @apply flex;\n}\n`,
    expect: 1,
    rule: 'moduleScope',
    keyword: 'grouped',
  },
  {
    /* 值寫不下而折行時只會折在括號裡(漸層、calc 那些)。
       把續行當成選擇器的話,`linear-gradient(142.26deg,` 的下一行會被讀成 `.26deg`,
       而那一段完全正常 —— 排版工具自己折的。 */
    name: 'moduleScope 值折行的小數不算 class',
    file: `${S}/gradient.css`,
    code: `.m-css-self-test {\n  background-image: linear-gradient(\n    142.26deg,\n    var(--white) 10.65%,\n    var(--white) 88.71%\n  );\n}`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 括號閉上之後照樣要檢查 —— 不然一個漸層就讓整支檔案的後半段失去檢查。 */
    name: 'moduleScope 值折行結束後照樣檢查',
    file: `${S}/gradientThenScope.css`,
    code: `.m-css-self-test {\n  background-image: linear-gradient(\n    142.26deg,\n    var(--white) 10.65%\n  );\n}\n\n.l-body {\n  @apply block;\n}`,
    expect: 1,
    rule: 'moduleScope',
    keyword: 'l-body',
  },
  {
    /* 緊接在 `&` 後面的是「同一個元素還掛著什麼」的條件,不是在定義那個 class ——
       共用的捲軸 class 由使用端掛上去,這裡只是「掛了它的時候」。
       報它的話,這種條件式的樣式沒有一種寫得出來的形狀。 */
    name: 'moduleScope 複合選擇器裡的附加 class 不算定義',
    file: `${S}/compound.css`,
    code: `.m-css-self-test {\n  &.scrollbar.\\-\\-y {\n    @apply flex;\n  }\n}`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 祖先是別的 class 時照樣要報 —— 那是「別人底下的我」,
       與「我身上還掛著什麼」是兩件事。 */
    name: 'moduleScope 祖先是別的 class 照樣報',
    file: `${S}/ancestor.css`,
    code: `.l-body .m-css-self-test {\n  @apply flex;\n}`,
    expect: 1,
    rule: 'moduleScope',
    keyword: 'l-body',
  },
  {
    /* 一筆宣告可以跨好幾行,而且每一行都以逗號收尾 —— 那個形狀與並列的選擇器
       一模一樣。不追蹤的話,`opacity 0.3s,` 裡的 `.3s` 會被讀成 class。 */
    name: 'moduleScope 跨行宣告裡的時間值不算 class',
    file: `${S}/transition.css`,
    code: `.m-css-self-test {\n  transition:\n    opacity 0.3s,\n    visibility 0.3s;\n}`,
    expect: 0,
    rule: 'moduleScope',
  },
  {
    /* 宣告收尾之後照樣檢查 —— 不然一筆跨行的宣告就讓整支檔案的後半段失去檢查。 */
    name: 'moduleScope 跨行宣告結束後照樣檢查',
    file: `${S}/transitionThen.css`,
    code: `.m-css-self-test {\n  transition:\n    opacity 0.3s,\n    visibility 0.3s;\n}\n\n.l-body {\n  @apply block;\n}`,
    expect: 1,
    rule: 'moduleScope',
    keyword: 'l-body',
  },
  {
    name: 'moduleScope 變體 class 要收斂成母體前綴',
    file: `${S}/switchItem.css`,
    code: `.m-switch-item-header {\n  @apply flex;\n}`,
    expect: 1,
    keyword: '收斂',
  },

  // ---------- 規則 moduleLocation ----------
  //
  // 集中目錄留給跨模組共用的變數。一支樣式的名字對得上某個實際存在的元件時,
  // 它就屬於那個元件 —— 留在集中目錄的話,class 前綴那條不會檢查它,
  // 而且沒有任何訊息:違規數字反而變少,看起來像程式碼變好了。
  {
    /* 探測用的元件資料夾在 onPrepare 就建好了(moduleScope 那幾則要用),
       所以這個名字一定對得上一個實際存在的元件。 */
    name: 'moduleLocation 對得上元件的樣式不可以留在集中目錄',
    file: `${L}/common.css`,
    code: `.m-css-self-test {\n  @apply flex;\n}`,
    expect: 1,
    rule: 'moduleLocation',
    keyword: 'mCssSelfTest',
  },
  {
    /* 對不上任何元件的就是跨模組共用的那種,留在集中目錄是對的。
       報它的話,共用變數會被逼著塞進某一個元件的資料夾,
       而另一個元件就得去 import 別人的檔案。 */
    name: 'moduleLocation 對不上任何元件的共用變數留在集中目錄不算違規',
    file: `${M}/sharedVariables.css`,
    code: `:root {\n  --probe-shared-pc-w: 10px;\n  --probe-shared-tablet-w: 10px;\n  --probe-shared-mobile-w: 10px;\n}`,
    expect: 0,
    rule: 'moduleLocation',
  },
  {
    /* 集中目錄先分一層類的擺法:歸屬是分類底下那支元件,不是分類本身。
       指的是分類的話,那一類底下每一支元件的樣式都會被叫去同一個資料夾,
       元件與樣式的對應關係反而消失。 */
    name: 'moduleLocation 分類層底下的樣式屬於那支元件,不是分類',
    file: `${GL}/${PROBE_NESTED_MODULE}/common.css`,
    code: `.m-css-self-test-chart {\n  @apply flex;\n}`,
    expect: 1,
    rule: 'moduleLocation',
    keyword: PROBE_NESTED_MODULE,
  },
  {
    /* 分類資料夾本身不是元件(它底下放的是元件,不是畫面)——
       名字對得上一個分類就搬的話,真正跨元件共用的變數會被塞進某一類裡面。 */
    name: 'moduleLocation 名字只對得上分類層的樣式留在集中目錄不算違規',
    file: `${GL}/shared.css`,
    code: `:root {\n  --probe-group-pc-w: 10px;\n  --probe-group-tablet-w: 10px;\n  --probe-group-mobile-w: 10px;\n}`,
    expect: 0,
    rule: 'moduleLocation',
  },

  // ---------- 規則 themeNaming ----------
  //
  // 檢查的是樣式設定檔本身，不是使用端。theme 是整組覆寫，
  // 重新定義的值再用 sm / md / lg 等於把剛拿掉的問題原樣搬回來。
  //
  // 這幾則一律指定 rule，只計 themeNaming 這一條。探測用的樣式設定檔
  // 放在專案根（規則就是去那裡找設定，放別處驗不到），而原始碼也放在專案根的
  // 專案（沒有 src 那一層的擺法）會把它一起當成原始碼掃 ——
  // 那時案例內容裡的 `sm:` 會被「用到已消失的 class」那條當成斷點前綴，
  // 每一則都多報一筆。不指定的話,同一份案例在兩種擺法的專案會有兩種結果。
  {
    name: 'themeNaming theme 直接定義了尺寸縮寫',
    rule: 'themeNaming',
    file: `${BUILD_STYLE_CONFIG}`,
    code:
      `export default {\n` +
      `  theme: {\n` +
      `    boxShadow: { sm: '0 0 2px #000', content: '0 0 15px #000' },\n` +
      `  },\n` +
      `}\n`,
    expect: 1,
    keyword: '定義了 sm',
  },
  {
    /* extend 底下是「補充」，內建值都還在，不是整組覆寫 ——
       那裡用 tailwind 自己的級距名是正常的，不該報。 */
    name: 'themeNaming extend 底下的不算整組覆寫',
    rule: 'themeNaming',
    file: `${BUILD_STYLE_CONFIG}`,
    code:
      `export default {\n` +
      `  theme: {\n` +
      `    extend: {\n` +
      `      spacing: { md: '16px' },\n` +
      `    },\n` +
      `  },\n` +
      `}\n`,
    expect: 0,
  },
  {
    name: 'themeNaming 說得出用途的名字不誤報',
    rule: 'themeNaming',
    file: `${BUILD_STYLE_CONFIG}`,
    code:
      `export default {\n` +
      `  theme: {\n` +
      `    boxShadow: { content: '0 0 15px #000', default: '0 0 4px #000' },\n` +
      `  },\n` +
      `}\n`,
    expect: 0,
  },
  {
    /* 值常常定義在另一支檔案再 import 進設定檔 —— 那一支也要檢查，
       否則把名字搬過去就繞過了規則。 */
    name: 'themeNaming 值定義在另一支檔案也要檢查',
    rule: 'themeNaming',
    file: `${THEME_SOURCE_FILE}`,
    code: `export const boxShadow = {\n  lg: '0 0 20px #000',\n  default: '0 0 4px #000',\n}\n`,
    expect: 1,
    keyword: '定義了 lg',
  },
  {
    name: 'themeNaming 標了豁免註解就整份放行',
    rule: 'themeNaming',
    file: `${BUILD_STYLE_CONFIG}`,
    code:
      `// lint-theme-naming-exempt: 沿用設計系統既有的命名\n` +
      `export default {\n` +
      `  theme: {\n` +
      `    boxShadow: { sm: '0 0 2px #000' },\n` +
      `  },\n` +
      `}\n`,
    expect: 0,
  },

  // ---------- 規則 moduleVar ----------
  {
    name: 'moduleVar 兩個級距值要搬 Variables',
    file: `${M}/probe.css`,
    code:
      `.m-probe {\n` +
      `  &.\\-\\-px-24 {\n    --probe-px: 24px;\n  }\n\n` +
      `  &.\\-\\-px-15 {\n    --probe-px: 15px;\n  }\n}`,
    expect: 1,
    keyword: '級距值',
  },
  {
    /* 集中目錄還沒有共用變數檔的專案(樣式都跟著元件走,那一層是空的)
       把設定留空,訊息就只講「搬到模組自己的 Variables 檔」——
       指一個不存在的位置比不講更糟:照著做會建出一支沒有人知道為什麼在那裡的檔案。

       兩種設定各驗一次,取的是規則實際讀的那一份值,不在這裡另外判斷。 */
    name: `moduleVar 提示${SHARED_MODULE_VARIABLES ? '指向共用變數檔' : '不指向不存在的共用變數檔'}`,
    file: `${M}/probeSharedHint.css`,
    code:
      `.m-probe {\n` +
      `  &.\\-\\-py-24 {\n    --probe-py: 24px;\n  }\n\n` +
      `  &.\\-\\-py-15 {\n    --probe-py: 15px;\n  }\n}`,
    expect: 1,
    rule: 'moduleVar',
    keyword: SHARED_MODULE_VARIABLES || '級距組要搬到',
  },
  {
    name: 'moduleVar 單一值不擋',
    file: `${M}/probe2.css`,
    code: `.m-probe {\n  &.\\-\\-px-24 {\n    --probe-px: 24px;\n  }\n}`,
    expect: 0,
  },
  {
    name: 'moduleVar Variables 檔本身不擋',
    file: `${M}/probeVariables.css`,
    code:
      `.m-probe {\n` +
      `  &.\\-\\-px-24 {\n    --probe-px: 24px;\n  }\n\n` +
      `  &.\\-\\-px-15 {\n    --probe-px: 15px;\n  }\n}`,
    expect: 0,
  },
  {
    /* 狀態 modifier 長得跟級距一模一樣(同前綴、兩個值),
      但 start / end 是狀態不是尺寸,搬進 Variables.css 沒有意義。 */
    name: 'moduleVar 狀態 modifier 不算級距',
    file: `${M}/probe3.css`,
    code:
      `.m-probe {\n` +
      `  &.\\-\\-range-start {\n    border-top-left-radius: 5px;\n  }\n\n` +
      `  &.\\-\\-range-end {\n    border-top-right-radius: 5px;\n  }\n}`,
    expect: 0,
  },

  // ---------- 規則 breakpointPrefix ----------
  //
  // 級距 class 由使用端傳進來,CSS 這邊要為每一個會命中的斷點各寫一次選擇器。
  // 少列一種的話,使用端那樣寫了在那個斷點沒有效果 —— 畫面上是「這個間距沒生效」,
  // 而那一行 class 看起來完全正常。
  //
  // 內容一律從設定組出來(哪個 @screen 要列哪幾種前綴),不寫死斷點名 ——
  // 各專案的斷點名不一樣,寫死的話那種專案永遠驗不到東西。
  ...breakpointPrefixCases(),
]

/**
 * ─────────────────────────────────────────────────────────────
 * 這一行是兩份案例的分界。
 *
 * 上面 CSS_CASES 是**樣式規範**的驗證（色票、tailwind、模組 css、變數）——
 * 那幾條規則依賴各專案自己的色票位置、tailwind 覆寫、模組命名，
 * 換一個專案要跟著換一份。
 *
 * 下面 RULE_CASES 是**結構規範**的驗證（api、store、頁面、import、全站）——
 * 那幾條只依賴 project-config.mjs 的目錄設定，案例本身不綁專案，
 * 換專案時可以整段搬過去。
 *
 * 兩份分開的理由:接收端常常只要其中一半。混在同一個陣列時，
 * 想只取一半就得從上千行裡逐一挑，而案例是跨多行的程式碼區塊，
 * 沒有可靠的分界 —— 結果不是整份覆蓋（另一半的驗證全部消失），
 * 就是放棄不搬。
 * ─────────────────────────────────────────────────────────────
 */
const RULE_CASES = [
  // ---------- 規則 projectName（規範系統自身，每一種副檔名都適用）----------
  {
    name: 'projectName .js 寫死專案名稱',
    file: `${D}/probe-name.js`,
    code: `export const API = 'https://${PROBE_PROJECT_SLUG}-api.example.com'\n`,
    expect: 1,
    keyword: '寫死了專案名稱',
  },
  {
    name: 'projectName .cjs 寫死專案名稱（hook 也是規範系統的一部分）',
    file: `${D}/probe-name.cjs`,
    code: `const base = '/${PROBE_PROJECT_SLUG}/assets/'\n`,
    expect: 1,
    keyword: '寫死了專案名稱',
  },
  {
    name: 'projectName 走環境變數不誤報',
    file: `${M}/probe-name2.js`,
    code: `export const API = import.meta.env.VITE_APP_APIPATH\n`,
    expect: 0,
  },
  {
    /* 名稱連寫起來常常就是某個更長的英文字的一部分(識別字、套件名尤其容易),
       那種不是在講這個專案。前後緊鄰英數字時一律不算命中 ——
       不然每一份有那種識別字的檔案都會被報一次,而一條全是誤報的規則會被整條忽略。 */
    name: 'projectName 名稱只是更長的英文字的一部分時不誤報',
    file: `${M}/probe-name-boundary.js`,
    code: `export const plugin = 'in${PROBE_PROJECT_SLUG}Functions'\n`,
    expect: 0,
    rule: 'projectName',
  },

  /* 目錄擺法與名稱是同一件事的兩面 —— 兩者都只在這個專案成立,
     寫進規範系統的檔案裡,搬到下一個專案就是錯的敘述。
     案例的內容一律從設定值組出來,不寫死字面路徑:
     寫死的話,別的專案跑這支驗證會因為「那不是它的目錄」而失敗。 */
  {
    /* 內容取規則實際會用的那一批值,不挑特定的設定項 ——
       挑到的那一項在別的專案可能是單段的(原始碼直接放專案根的專案,
       頁面目錄就叫 `pages`),而規則刻意不抓單段值,
       那時這一則在那種專案永遠驗不到東西,失敗的訊息卻看起來像規則壞了。 */
    name: 'projectName 規範系統裡寫死這個專案的目錄',
    file: `${D}/probe-dir.md`,
    code: `只檢查 ${PROJECT_DIR_VALUES[0]} 底下的檔案\n`,
    expect: 1,
    rule: 'projectName',
    keyword: '寫死了這個專案的目錄',
    needs: 'projectDirValues',
  },
  {
    /* 佔位符是正確的寫法 —— 讀的人知道要換成自己的路徑,
       而這份文件搬到下一個專案仍然成立。 */
    name: 'projectName 指令範例用佔位符不誤報',
    file: `${D}/probe-dir-placeholder.md`,
    code: 'npm run lint:css <檔案或目錄>\n',
    expect: 0,
    rule: 'projectName',
  },
  {
    /* 單段的名字在中文敘述裡到處都是(「store 目錄」「頁面放 pages」),
       抓了全是誤報,而一條每次報幾十筆的規則會被整條忽略。 */
    name: 'projectName 目錄名的最後一段出現在敘述裡不誤報',
    file: `${D}/probe-dir-single.md`,
    code: `狀態放在 ${STORE_DIR.split('/').at(-1)} 這一層\n`,
    expect: 0,
    rule: 'projectName',
  },
  {
    /* 教人填設定的文件本來就要寫出實際的目錄值 —— 標了豁免就整份跳過。
       內容同樣取規則會用的那一批,挑特定設定項的話,
       那一項是單段值的專案本來就不會被抓,這一則等於什麼都沒驗到。 */
    name: 'projectName 標了豁免的文件可以寫出目錄值',
    file: `${D}/probe-dir-exempt.md`,
    code: `<!-- lint-project-name-exempt: 這份在教人填設定 -->\n\n設定填 ${PROJECT_DIR_VALUES[0]}\n`,
    expect: 0,
    rule: 'projectName',
    needs: 'projectDirValues',
  },
  {
    /* 路徑形狀的問題全部歸 absolutePath 這一條,不與 projectName 重複計算 ——
      同一行報兩筆敘述不同的違規,豁免時還得標兩種標記。
      三種作業系統的形狀都要抓,只認一種的話換台機器規則就等於失效。

      第一行往上跳的層數刻意寫得很多,確保一定跳出專案根目錄 ——
      層數少的話,它可能剛好落在某個 alias 涵蓋的位置,那時會多命中一筆
      「離開自己資料夾要用 alias」,而那取決於專案的目錄有幾層深。

      這三行各自命中的規則:
        第 1 行  absolutePath(往上跳的層數多到離開了專案根)
        第 2 行  absolutePath(磁碟機代號)
        第 3 行  absolutePath(家目錄)
      合計 3 筆。 */
    name: 'absolutePath 跨專案引用與三種作業系統的絕對路徑',
    file: `${M}/probe-name3.js`,
    code:
      `import a from '../../../../../../../../SomeOther/src/utils.js'\n` +
      `import b from 'C:/somewhere/src/b.js'\n` +
      `import c from '/Users/someone/somewhere/src/c.js'\n`,
    expect: 3,
    keyword: '跨專案',
  },
  {
    /* 往上跳三層,但這支檔案本來就埋得夠深,解析完仍在專案裡 —— 不是跨專案引用。
       固定用層數判斷的話,深一點的目錄裡正常的引用會被整批誤報,
       而需要寫字面路徑的場合(建置工具的 glob)連改都改不掉。

       探測檔自己再往下三層,所以「往上三層」一定還在探測目錄裡 ——
       深度不跟著設定的目錄段數跑,換一種擺法結果仍然相同。 */
    name: 'absolutePath 往上跳但仍在專案內不誤報',
    rule: 'absolutePath',
    file: `${M}/deep/nested/inner/probeInside.js`,
    code: `import a from '../../../probe.js'\n`,
    expect: 0,
  },

  // ---------- .md 也要被檢查（skills、rules、說明文件都是 .md）----------
  {
    name: '.md 寫死專案名稱要被抓',
    file: `${D}/probe-name.md`,
    code: `# 說明\n\n這份文件是 ${PROBE_PROJECT_SLUG} 專案專用的。\n`,
    expect: 1,
    keyword: '寫死了專案名稱',
  },
  {
    name: '.md 寫絕對路徑要被抓',
    file: `${D}/probe-path.md`,
    code: `# 說明\n\n設定檔放在 C:/work/project/config.js。\n`,
    expect: 1,
    keyword: '只在特定電腦上成立',
  },
  {
    name: '.md 標了豁免註解就整份放行',
    file: `${D}/probe-exempt.md`,
    code: `<!-- lint-absolute-path-exempt: 這一段在說明規則抓哪幾種形狀 -->\n\n# 說明\n\n會抓 C:/ 開頭與 file:// 開頭的路徑。\n`,
    expect: 0,
  },
  {
    name: '.md 相對專案根的路徑不誤報',
    file: `${D}/probe-ok.md`,
    code: `# 說明\n\n判斷邏輯在 .tools/lint/,規範見 .claude/skills/。\n`,
    expect: 0,
  },

  // ---------- 兩條規則的範圍界線 ----------
  //
  // projectName 只管規範系統自身,absolutePath 連原始碼一起管。
  // 兩條共用同一份範圍的話,頁面文案裡的品牌名會被當成違規 ——
  // 那類正當內容的數量遠多於真正的違規,清單會被淹沒。
  {
    name: 'projectName:原始碼裡的品牌名是內容,不報',
    rule: 'projectName',
    file: `${P}/probeBrandName.vue`,
    code: `<template>\n  <p>RoyalCanin</p>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'absolutePath:原始碼裡的絕對路徑照樣報',
    rule: 'absolutePath',
    file: `${P}/probeAbsolutePath.vue`,
    code: `<script setup>\n// 圖片放在 C:/work/assets/\n</script>\n`,
    expect: 1,
    keyword: '只在特定電腦上成立',
  },

  // ---------- 專案自己的文件:結構與命名那些規則都不檢查 ----------
  //
  // 同一份內容放在規範系統底下會被抓好幾筆(品牌名、絕對路徑),
  // 放在專案文件目錄則一筆都不該有 —— 那裡的內容本來就會提到這些。
  {
    name: '專案文件:品牌名與絕對路徑都不報',
    file: `${PD}/probe-doc.md`,
    code: `# RoyalCanin 規格\n\n檔案在 C:/work/spec.xlsx,網址 file:///spec。\n`,
    expect: 0,
  },
  {
    name: '專案文件:貼不合規範的範例程式碼也不報',
    file: `${PD}/probe-sample.md`,
    code:
      '# 範例\n\n```js\n' +
      `import axios from 'axios'\n` +
      `export const activityList = (data) => axios.get('activity/list', data)\n` +
      '```\n',
    expect: 0,
  },

  // ---------- 規則 plainText ----------
  //
  // 寫給人讀的文字裡不放 emoji 與裝飾符號 —— 客戶會看到,那是正式的工作文件。
  // 範圍是所有規則裡最大的:原始碼、規範系統,還有專案自己的文件。
  {
    name: 'plainText 規範文件用了裝飾符號',
    file: `${D}/probe-mark.md`,
    code: `# 說明\n\n🔧 這裡必須同時滿足三個條件。\n`,
    expect: 1,
    keyword: '裝飾符號',
  },
  {
    name: 'plainText 原始碼的註解也算',
    rule: 'plainText',
    file: `${P}/probeMark.vue`,
    code: `<script setup>\n// \u{1f527} 存檔時會自動排序\n</script>\n`,
    expect: 1,
    keyword: '裝飾符號',
  },
  {
    /* 畫面上的文字是內容本身(標題、按鈕上的字、給使用者看的提示)——
       那裡出現什麼符號由設計與文案決定,不是規範系統要管的事。 */
    name: 'plainText 畫面上的文字不檢查',
    file: `${P}/probeMarkTemplate.vue`,
    code: `<template>\n  <div class="m-probe">\u{1f527} 設定</div>\n</template>\n`,
    expect: 0,
    rule: 'plainText',
  },
  {
    /* 同一句文案,有的直接寫在畫面區段裡,有的抽成 config 物件往下傳 ——
       兩者是同一種東西。只放行畫面區段的話,等於在管元件怎麼組織,不是在管文字。 */
    name: 'plainText 元件裡當成資料寫的畫面文案也放行',
    rule: 'plainText',
    file: `${SC}/Index.vue`,
    code: `<script setup>\nconst config = { content: '成交速度 ↑ 2.5 倍' }\n</script>\n\n<template>\n  <p>{{ config.content }}</p>\n</template>\n`,
    expect: 0,
  },
  {
    /* 註解照樣抓 —— 那是寫給接手的人讀的,與程式碼旁邊的註解沒有兩樣。 */
    name: 'plainText 元件裡的註解照樣抓',
    rule: 'plainText',
    file: `${SC}/Index.vue`,
    code: `<script setup>\n// ⚠️ 這裡要小心\nconst a = 1\n</script>\n\n<template>\n  <p>x</p>\n</template>\n`,
    expect: 1,
    keyword: '裝飾符號',
  },
  {
    /* store 與 api 那幾層的字串是參數、端點、狀態代碼,不是給人看的文案。 */
    name: 'plainText store 裡的字串不算畫面文案,照樣抓',
    rule: 'plainText',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `export const label = '★ 標記'\n`,
    expect: 1,
    keyword: '裝飾符號',
  },
  {
    /* 畫面區段裡的註解是寫給接手的人讀的,與程式碼旁邊的註解沒有兩樣 ——
       放行的話,同一句話寫在畫面區段裡就繞過了整條規則。 */
    name: 'plainText 畫面區段裡的註解照樣抓',
    file: `${P}/probeMarkTplComment.vue`,
    code: `<template>\n  <!-- ✅ 這一段之後要拆成兩個區塊 -->\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    rule: 'plainText',
    keyword: '✅',
  },
  {
    /* 原始碼那側只看樣式、程式與元件 —— 這一條在原始碼裡看的是註解,
       而註解就出現在那幾種檔案裡。規範系統自身不受這個限制:
       那一層整批複製到下一個專案,說明文件正是交接時對方要讀的。 */
    name: 'plainText 原始碼的其他副檔名不檢查',
    file: `${P}/probe-mark.md`,
    code: `# 筆記\n\n\u{1f527} 這一頁的資料來源要換掉。\n`,
    expect: 0,
    rule: 'plainText',
  },
  {
    /* 專案文件那一層一條規則都不跑 —— 那裡有自己的檢查工具,
       兩套工具掃同一層的話,判準會各自演化。 */
    name: 'plainText 專案文件不檢查',
    file: `${PD}/probe-mark.md`,
    code: `# 規格\n\n✅ 已完成\n`,
    expect: 0,
  },
  {
    /* 終端機的狀態記號不是文件,是程式跑起來當下的回饋;
       一排訊息裡要能一眼分出哪幾筆有問題。 */
    name: 'plainText 終端機的狀態記號不算裝飾',
    file: `${D}/probe-status.mjs`,
    code: `console.log('\u2714 通過')\nconsole.error('\u2717 違規')\n`,
    expect: 0,
  },
  {
    /* 同一個狀態記號寫進註解就是裝飾 —— 印出來的那一份幫讀者分辨狀態,
       註解裡的只剩「這裡很重要」的語氣。分辨的方式是看它在不在字串裡。 */
    name: 'plainText 狀態記號寫在註解裡照樣抓',
    file: `${D}/probe-status-comment.mjs`,
    code: `// ⚠️ 這裡要小心\nconst probe = 1\n`,
    expect: 1,
    keyword: '⚠',
  },
  {
    /* 帶理由的訊息常常夾在同一行的字串裡 —— 那仍然是要印出來的東西 */
    name: 'plainText 字串裡的狀態記號放行,同一行的註解照樣抓',
    file: `${D}/probe-status-mixed.mjs`,
    code: `console.log('✔ 通過')\n// ✗ 這一行是註解\n`,
    expect: 1,
    keyword: '✗',
  },
  {
    /* 「在字串裡」不是通行證 —— 放行的條件有兩個,要同時成立:
       是狀態記號(那份清單裡的),而且寫在字串裡。
       少了前一個條件的話,任何 emoji 只要包進引號就能過,
       而印出來的訊息正是客戶最常看到的那一批文字。 */
    name: 'plainText 不是狀態記號的符號,寫在字串裡照樣抓',
    file: `${D}/probe-status-other.mjs`,
    code: `console.log('🔧 已自動排序')\n`,
    expect: 1,
    rule: 'plainText',
    keyword: '🔧',
  },
  {
    // 對照表的箭頭是資訊本身,換成文字反而讓整欄對不齊
    name: 'plainText 對照表的箭頭不算裝飾',
    file: `${D}/probe-table.md`,
    code: `# 對照表\n\napiActivityList \u2192 apiGetActivityList\n`,
    expect: 0,
  },
  {
    name: 'plainText 純文字不誤報',
    file: `${D}/probe-plain.md`,
    code: `# 說明\n\n注意:這裡必須同時滿足三個條件,否則會刪到程式碼。\n`,
    expect: 0,
  },
  {
    /* 豁免只認註解裡的那一份 —— 程式碼裡的字面值也算的話,定義比對式的那一行
       會讓規則檔永遠豁免自己,那條規則對它完全失效,而且不會有任何徵兆。
       這一則的探針同時有兩種:程式碼裡的不算,所以註解裡的符號照樣要被抓。 */
    name: 'plainText 豁免寫在程式碼裡不算',
    file: `${D}/probe-fake-exempt.mjs`,
    code: `const EXEMPT_RE = /lint-plain-text-exempt/\n// ✅ 這一行是註解\n`,
    expect: 1,
    keyword: '✅',
  },
  {
    /* 驗證案例的內容裡會整段寫出一個豁免標記當作要檢查的資料 ——
       標記前面確實有註解的起頭,但它屬於字串的內容,不是在宣告豁免。
       算它的話,寫這種案例的檔案會整份被放行,而放行的當下沒有任何訊息。 */
    name: 'plainText 豁免標記寫在字串裡不算宣告',
    file: `${D}/probe-exempt-in-string.mjs`,
    code: `const probe = \`<!-- lint-plain-text-exempt: 這是資料 -->\`\n// ✅ 這一行是註解\n`,
    expect: 1,
    rule: 'plainText',
    keyword: '✅',
  },
  {
    /* 說明文件舉例時會整段寫出一個豁免標記,那是給人看的範例,不是宣告。
       算它的話,一份在說明「這條規則抓什麼」的文件會因為舉了例子
       而讓自己不被那條規則檢查,而且沒有任何徵兆。 */
    name: 'plainText 豁免標記寫在範例區塊裡不算宣告',
    file: `${D}/probe-exempt-in-example.md`,
    code: '# 說明\n\n要放行時這樣標:\n\n```css\n/* lint-plain-text-exempt: 這是範例 */\n```\n\n這份自己沒有標,所以 ✅ 這個符號照樣要被抓。\n',
    expect: 1,
    rule: 'plainText',
    keyword: '✅',
  },
  {
    name: 'plainText 標了豁免註解就整份放行',
    file: `${D}/probe-mark-exempt.md`,
    code: `<!-- lint-plain-text-exempt: 這份在說明規則抓哪幾種符號 -->\n\n# 說明\n\n會抓 \u26a0\ufe0f 與 \u2705 這類符號。\n`,
    expect: 0,
  },

  // ---------- 規則 selfContained ----------
  //
  // 「同上」「同 2」「參考第三節」把讀者送去別處。讀的人多半從中間開始看,
  // 沒有「上一段」可以參照 —— 跳兩次就放棄了。
  //
  // 中文句子裡詞與詞之間沒有空格,所以不能要求這些詞前面一定是標點;
  // 有誤報風險的用前置或後置排除處理,下面兩組案例就是在守這條界線。
  {
    name: 'selfContained 同上',
    file: `${D}/probe-ref1.md`,
    code: `# 說明

這一段的設定同上。
`,
    expect: 1,
    keyword: '同上',
  },
  {
    /* 省略量詞的寫法也要抓 —— 「同 2」比「同第 2 點」更常見,
       漏掉的話這條規則等於只擋了一半。 */
    name: 'selfContained 同 2 這種省略量詞的也要抓',
    file: `${D}/probe-ref2.md`,
    code: `# 說明

命名規則同 2。
`,
    expect: 1,
    keyword: '同 2',
  },
  {
    name: 'selfContained 參考第三節',
    file: `${D}/probe-ref3.md`,
    code: `# 說明

錯誤處理參考第三節。
`,
    expect: 1,
    keyword: '參考第三節',
  },
  {
    name: 'selfContained 見上一節',
    file: `${D}/probe-ref4.md`,
    code: `# 說明

設定方式見上一節。
`,
    expect: 1,
    keyword: '見上一節',
  },
  {
    /* 「相同 2 個」「不同 3 種」是正常句子,那個「同」屬於前面那個詞。
       不排除的話,整批正常敘述都會被報。 */
    name: 'selfContained 相同 / 不同 接數字不誤報',
    file: `${D}/probe-ref-ok1.md`,
    code: `# 說明

這裡必須滿足相同 2 個條件,不同 3 種情況要分開處理。
`,
    expect: 0,
  },
  {
    /* 「同上」「同前」後面接中文字就是別的詞：共同前提的前是前提、
       同前綴的前是前綴。真的在說「跟前面一樣」時，後面是標點或換行。 */
    name: 'selfContained 共同前提 / 同前綴 不誤報',
    file: `${D}/probe-ref-ok4.md`,
    code: `# 說明\n\n跨規則的共同前提有四份。狀態 modifier 長得跟級距一樣(同前綴、兩個值)。\n`,
    expect: 0,
  },
  {
    name: 'selfContained 同前 單獨出現要抓',
    file: `${D}/probe-ref5.md`,
    code: `# 說明\n\n這一段的設定同前。\n`,
    expect: 1,
    keyword: '同前',
  },
  {
    name: 'selfContained 同理心不誤報',
    file: `${D}/probe-ref-ok2.md`,
    code: `# 說明

這個設計要有同理心。
`,
    expect: 0,
  },
  {
    /* 指向別的檔案是有用的補充,不是把讀者丟回同一份文件的別處 ——
       前提是這一段自己要講的已經講完了。 */
    name: 'selfContained 指向別的檔案不算',
    file: `${D}/probe-ref-ok3.md`,
    code: `# 說明

這裡照著回傳的狀態決定要不要導頁。完整清單見 .tools/lint/ 底下的規則檔。
`,
    expect: 0,
  },
  {
    // 專案文件那一層一條規則都不跑,這一條也不例外
    name: 'selfContained 專案文件不檢查',
    file: `${PD}/probe-ref.md`,
    code: `# 規格

這一頁的欄位同上。
`,
    expect: 0,
  },
  {
    name: 'selfContained 標了豁免註解就整份放行',
    file: `${D}/probe-ref-exempt.md`,
    code: `<!-- lint-self-contained-exempt: 這份在說明規則抓哪幾種寫法 -->

# 說明

會抓「同上」「同 2」這類寫法。
`,
    expect: 0,
  },


  // ---------- 規則 absolutePath ----------
  {
    // 不只 import —— 註解、說明文字裡的絕對路徑同樣要抓
    name: 'absolutePath 註解裡的絕對路徑',
    file: `${M}/probe-abs1.js`,
    code: `// 設定檔放在 C:/work/project/config.js\nexport const a = 1\n`,
    expect: 1,
    keyword: '只在特定電腦上成立',
  },
  {
    name: 'absolutePath 家目錄與 file:// 都要抓',
    file: `${M}/probe-abs2.js`,
    code: `// 範例:/Users/someone/project 或 file:///tmp/a.js\nexport const a = 1\n`,
    expect: 2,
    keyword: '絕對路徑',
  },
  {
    /* 專案裡本來就有 views/home/ 這種資料夾,`views/home/Index.vue` 不是家目錄路徑。
      少了「前面不能接文字字元」那道條件,整批頁面都會被誤報。 */
    name: 'absolutePath 專案內的 home 資料夾不誤報',
    file: `${M}/probe-abs3.js`,
    code: `import a from '@views/home/Index.vue'\nconst img = 'assets/img/home/banner.png'\n`,
    expect: 0,
  },
  {
    name: 'absolutePath 相對專案根的路徑不誤報',
    file: `${M}/probe-abs4.js`,
    code: `// 判斷邏輯在 .tools/lint/,規範見 .claude/skills/\nexport const a = 1\n`,
    expect: 0,
  },
  {
    // 同層相對路徑與 alias 都不該被抓（`../` 會另外命中 importAlias，那條有自己的案例）
    name: 'projectName 一般相對路徑不誤報',
    file: `${M}/probe-name4.js`,
    code: `import a from './utils.js'\nimport b from './shared/b.js'\nimport c from '@js/_prototype.js'\n`,
    expect: 0,
  },

  // ---------- 規則 apiClient / apiScope / apiSource ----------
  {
    name: 'apiClient 使用 axios',
    file: `${A}/selfTestAlpha.js`,
    code: `import axios from 'axios'\n\nexport const apiHome = (data) => axios.get('home', data)\n`,
    expect: 1,
    keyword: '不得使用 axios',
  },
  {
    // 原生請求是建議級：印出來提醒，但不擋、不列入阻擋計數
    rule: 'apiClient',
    name: 'apiClient 原生請求只給建議',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nconst xhr = new XMLHttpRequest()\n`,
    expect: 0,
    expectWarn: 1,
    keyword: '繞過',
  },
  {
    /* 檔頭標了理由就整支放行 —— 有些檔案打的根本不是產品的 api
       (開發用的除錯面板、只在本機跑的工具),那些請求本來就不需要共用的攔截器。
       沒有出口的話那幾筆每次都再印一遍而且改不掉,
       一條一直報「改不了的東西」的規則最後會連同真正該改的一起被略過。 */
    name: 'apiClient 檔頭標了豁免就放行',
    file: `${A}/selfTestAlpha.js`,
    code: `// lint-api-client-exempt: 這支打的是本機除錯端點,不需要共用攔截器\n\nconst xhr = new XMLHttpRequest()\n`,
    expect: 0,
    expectWarn: 0,
  },
  {
    // 原生 fetch 與 XMLHttpRequest 一樣是建議級：繞過共用實例，攔截器帶的參數不會生效
    name: 'apiClient 原生 fetch 也給建議',
    file: `${A}/selfTestAlpha.js`,
    code: `export const apiGetSelfTestAlpha = () => fetch('https://example.com/data')\n`,
    expect: 0,
    expectWarn: 1,
    keyword: '繞過',
  },
  {
    /* 走共用實例的寫法不能被當成原生請求 —— onFetchApi / fetchApi.get 這些
      名字裡都有 fetch，誤報的話每一支 api 檔案都會被提醒一次。 */
    name: 'apiClient 共用實例的呼叫不誤報',
    file: `${A}/selfTestAlpha.js`,
    code: `import fetchApi from './.config.js'\n\nexport const apiGetSelfTestAlpha = (data) => fetchApi.get('selfTestAlpha', data)\n`,
    expect: 0,
    expectWarn: 0,
  },
  {
    name: 'apiScope 檔名對不上資料夾（單複數）',
    file: `${A}/selfTestPet.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetPet = (data) => fetchApi.get('pet', data)\n`,
    expect: 1,
    keyword: 'selfTestPets/',
  },
  {
    /* 共用那一支叫什麼從設定取 —— 每個專案的檔名不一樣,寫死的話,
       換一個專案這則會去比對一個它沒有的檔名,而規則本身是對的。 */
    name: 'apiScope 檔名完全沒有對應資料夾',
    file: `${A}/nowhere.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetX = (data) => fetchApi.get('x', data)\n`,
    expect: 1,
    keyword: `搬進 ${SHARED_API_FILE}.js`,
  },
  {
    name: 'apiScope 檔名對得上資料夾不誤報',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetHome = (data) => fetchApi.get('home', data)\n`,
    expect: 0,
  },
  {
    /* 檔名用設定值,不寫死 —— 「對不上資料夾的 api 放哪一支」是設定
       (SHARED_API_FILE),每個專案叫的名字不一樣。寫死的話,案例在別的專案
       會變成「一支對不上資料夾的 api」而被報違規,看起來像規則壞了。 */
    name: 'apiScope 共用的那一支不誤報',
    file: `${A}/${SHARED_API_FILE}.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetX = (data) => fetchApi.get('x', data)\n`,
    expect: 0,
  },
  {
    name: 'apiSource api 檔案自己建實例',
    file: `${A}/selfTestAlpha.js`,
    code: `import { onFetchApi } from '@js/_api/.export.js'\n\nconst api = onFetchApi({ baseURL: '/api/' })\n`,
    expect: 1,
    keyword: 'onFetchApi',
  },

  // ---------- 規則 storeDir ----------
  //
  // 資料夾名全站只用一種寫法。混用兩種的話，每次寫 import 都要先確認
  // 這一支是哪一種 —— 而兩種都存在時，錯的那個不會報錯，只是找不到檔案。
  {
    /* 探測檔擺在 store 目錄底下的探測資料夾裡，路徑中間插一段錯寫法的資料夾名。
       這樣結束時跟著探測資料夾一起被清掉 —— 直接在原始碼根目錄建一個
       `Stores/` 的話，清理不會涵蓋到，會在專案裡留下一個看起來像真的目錄。 */
    name: 'storeDir 資料夾名大小寫或單複數不一致',
    // 檔名取例外清單裡的，才不會同時觸發「檔名要對得上頁面資料夾」那條
    file: `${T}/Stores/${PROBE_PAGE_ALPHA}.js`,
    code: `/* lint-store-layer-exempt: 這則在驗資料夾名,不驗分層 */
export const use${pascalOf(PROBE_PAGE_ALPHA)}Store = null\n`,
    /* 正確的資料夾名是設定裡 store 目錄的最後一層 —— 那個字每個專案不一樣,
       寫死的話,把 store 放在別的名字底下的專案會比對到一個它沒有的字。 */
    expect: 1,
    keyword: `${STORE_DIR.split('/').pop()}/`,
  },
  {
    // 正確的資料夾名不該被自己的規則報
    name: 'storeDir 正確的資料夾名不誤報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `/* lint-store-layer-exempt: 這則在驗資料夾名,不驗分層 */
export const use${pascalOf(PROBE_PAGE_ALPHA)}Store = null\n`,
    expect: 0,
  },

  // ---------- 規則 storeDeclare / storeNaming / storeScope / storeActions ----------
  {
    name: 'storeDeclare store 裡宣告 function',
    file: `${T}/selfTestBeta.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useHomeStore = defineStore('home', () => {\n  const list = ref(null)\n\n  const onReset = () => {\n    list.value = null\n  }\n\n  return { list, onReset }\n})\n`,
    expect: 1,
    keyword: '宣告了 function onReset',
  },
  {
    // 用 ALLOWED_STANDALONE 內的檔名，才不會同時觸發 storeLayer（那條另有案例）
    name: 'storeDeclare computed 不誤報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `/* lint-store-layer-exempt: 這則在驗 computed 算不算行為,不驗分層 */\nimport { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const list = ref([])\n  const total = computed(() => list.value.length)\n  const info = readonly({ a: 1 })\n\n  return { list, total, info }\n})\n`,
    expect: 0,
  },
  {
    name: 'storeDeclare 物件屬性寫成 function',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `/* lint-store-layer-exempt: 這則在驗物件屬性寫成 function,不驗分層 */\nimport { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const config = ref({\n    onDone: () => {},\n  })\n\n  return { config }\n})\n`,
    expect: 1,
    keyword: '物件屬性 onDone',
  },
  {
    // 在 store 內取用另一個 store 是 pinia 的正常用法,不是行為
    name: 'storeDeclare 取用另一個 store 不誤報',
    file: `${T}/selfTestBeta.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useKnowledgeStore = defineStore('knowledge', () => {\n  const json = useJsonStore()\n  const { list } = storeToRefs(json)\n\n  return { list }\n})\n`,
    expect: 0,
  },
  {
    name: 'storeNaming 命名不是 use*Store',
    file: `${T}/selfTestBeta.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const eventsStore = defineStore('events', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
    expect: 1,
    keyword: 'use{名稱}Store',
  },
  {
    name: 'storeScope 檔名對不上資料夾',
    file: `${T}/selfTestPet.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const usePetStore = defineStore('pet', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
    expect: 1,
    keyword: 'selfTestPets/',
  },
  {
    /* store 大到要拆成好幾支時會放進子資料夾,那時檔名指的是那個資源底下的
       某一個畫面 —— 拿第一層去比對的話,分層的專案每一支都會被報
       「沒有對應的資料夾」,而它們其實都對得上。 */
    name: 'storeScope 分層的 store 對得上資源底下那一層',
    file: `${T}/${PROBE_PAGE_SUB_FOLDER}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useProbeStore = defineStore('probe', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
    expect: 0,
    rule: 'storeScope',
  },
  /* 這一則驗的正是「例外清單」這個機制,所以要用清單裡的值,不能寫死某個名字 ——
     清單(STANDALONE_STORES)每個專案不一樣。清單是空的時候整則跳過:
     沒有例外可驗的專案,硬塞一個名字進去只會變成「一支對不上資料夾的 store」。 */
  ...(STANDALONE_STORES.length
    ? [
        {
          name: 'storeScope 例外清單內的不誤報',
          file: `${T}/${STANDALONE_STORES[0]}.js`,
          code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(STANDALONE_STORES[0])}Store = defineStore('${STANDALONE_STORES[0]}', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
          expect: 0,
        },
      ]
    : []),
  {
    name: 'storeActions 檔名不是 use*Actions',
    file: `${T}/.composables/homeActions.js`,
    code: `export const useHomeActions = () => ({})\n`,
    expect: 1,
    keyword: 'use{名稱}Actions.js',
  },
  {
    name: 'storeActions 正確檔名不誤報，且 actions 裡可以有 function',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code: `export const useHomeActions = () => {\n  const onReset = () => {}\n\n  return { onReset }\n}\n`,
    expect: 0,
  },

  // ---------- 規則 apiNaming ----------
  //
  // 錢字號在 JS 識別字裡是合法字元，有人用它代替 endpoint 裡的底線。
  // 比對式只認 \w 的話，名字會在那個字元斷掉、接著比對不到等號，
  // 整支 api 會被跳過 —— 不是報錯，是從此不檢查，而且看起來像通過。
  {
    name: 'apiNaming 名字含錢字號的 api 不可以整支被跳過',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiQuestionnaireQ3$1 = (data) => fetchApi.post('questionnaire/q3_1', data)\n`,
    expect: 1,
    keyword: 'method 寫在前面',
  },
  {
    /* 端點用連字號分詞時,函式名把它接成一個駝峰字 ——
       連字號在識別字裡不合法,原樣留著的話期望名會長出 `Verification-code`,
       那種名字寫不出來,那幾支不管怎麼命名都會紅。 */
    name: 'apiNaming 連字號的端點接成駝峰',
    rule: 'apiNaming',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiPostVerificationCode = (data) => fetchApi.post('verification-code', data)\n`,
    expect: 0,
  },
  {
    /* 底線不處理 —— 它在識別字裡是合法字元,端點寫 q3_1 函式名就照樣寫 Q3_1。
       連底線一起吃掉的話,那種命名會全部對不上,而它們本來是對的。 */
    name: 'apiNaming 底線的端點也接成駝峰',
    rule: 'apiNaming',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiPostQuestionQ31 = (data) => fetchApi.post('question/q3_1', data)\n`,
    expect: 0,
  },
  {
    // 建議名也不能帶連字號 —— 照著建議改的人要能直接貼上去
    name: 'apiNaming 連字號端點的建議名不含連字號',
    rule: 'apiNaming',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiPostWrongName = (data) => fetchApi.post('verification-code', data)\n`,
    expect: 1,
    keyword: 'apiPostVerificationCode',
  },
  {
    /* 端點本身帶 api 字樣時,那一段不計入名字 —— 函式名已經以 api 開頭,
       再帶一次會組出 apiGetApiADSearch 這種名字。 */
    name: 'apiNaming 端點的 api 前綴不計入名字',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiGetADSearch = (data) => fetchApi.get('apiAD/Search', data)\n`,
    expect: 0,
  },
  {
    name: 'apiNaming 端點整段就是 api 時那一段拿掉',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiGetMemberInfo = (data) => fetchApi.get('api/member/info', data)\n`,
    expect: 0,
  },
  {
    /* api 後面接小寫時那是一個完整的字(apiary),剝掉會把端點切成看不懂的東西。
       只有後面接大寫或數字才算前綴。 */
    name: 'apiNaming api 開頭的完整單字不可以被剝掉',
    file: `${A}/${PROBE_PAGE_ALPHA}.js`,
    code:
      `import { fetchApi } from './.config.js'\n\n` +
      `export const apiGetApiaryList = (data) => fetchApi.get('apiary/list', data)\n`,
    expect: 0,
  },
  {
    name: 'apiNaming 沒有寫出 method',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiActivityList = (data) => fetchApi.get('activity/list', data)\n`,
    expect: 1,
    keyword: 'apiGetActivityList',
  },
  {
    // method 從後綴改成前綴之後，舊寫法要被抓出來
    name: 'apiNaming method 寫在後面(舊寫法)要被抓',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiActivityListGet = (data) => fetchApi.get('activity/list', data)\n`,
    expect: 1,
    keyword: 'apiGetActivityList',
  },
  {
    name: 'apiNaming 函式名對不上 endpoint',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetMemberInfo = (data) => fetchApi.get('member/info/update', data)\n`,
    expect: 1,
    keyword: 'apiGetMemberInfoUpdate',
  },
  {
    name: 'apiNaming 沒有 api 前綴',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const getActivityList = (data) => fetchApi.get('activity/list', data)\n`,
    expect: 1,
    keyword: '要以 api 開頭',
  },
  {
    /* 路徑長一點的時候會被格式化成兩行，名字與請求分開寫。
      比對式不跨行的話，這種寫法完全不會被檢查到 —— 而且沒有任何徵兆，
      看起來就是「這支沒問題」。 */
    name: 'apiNaming 名字與請求分兩行寫也要檢查',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiActivityList = (data) =>\n  fetchApi.get('activity/list', data)\n`,
    expect: 1,
    keyword: 'apiGetActivityList',
  },
  {
    /* 中間不得跨過另一個 export —— 沒有這道限制的話，比對會從前面那支
      不打 api 的匯出開始，一路吃到後面那支的請求，
      把前面那支誤判成打了後面那支的 endpoint。 */
    name: 'apiNaming 不會跨過中間的其他 export 而誤判',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const selfTestAlphaHelper = (value) => value\n\nexport const apiGetSelfTestAlphaDetail = (data) =>\n  fetchApi.get('selftestalpha/detail', data)\n`,
    expect: 0,
  },
  {
    name: 'apiNaming 正確命名不誤報（含路徑參數與非 GET）',
    file: `${A}/selfTestAlpha.js`,
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      `export const apiGetActivityList = (data) => fetchApi.get('activity/list', data)\n` +
      `export const apiPostMemberInfoUpdate = (data) => fetchApi.post('member/info/update', data)\n` +
      `export const apiGetVoucherItemID = (data) => fetchApi.get('voucher/item/{id}', data)\n` +
      `export const apiDeleteMemberPetID = (data) => fetchApi.delete('member/pet/{id}', data)\n` +
      `export const apiPostFormPhotoUpload = (data) => fetchApi.postForm('photo/upload', data)\n`,
    expect: 0,
  },
  {
    /* 路徑參數用 template literal 時，${id} 的大括號不可以被
      apiReturn 當成「自己組了一份物件回傳」—— 那會讓每一支帶參數的 api 都誤報 */
    name: 'apiReturn 直接回 fetchApi(含路徑參數)不誤報',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetVoucherItemID = (data) => fetchApi.get('voucher/item/{id}', data)\n`,
    expect: 0,
  },
  {
    name: 'apiReturn 自己組回傳卻少欄位',
    file: `${A}/selfTestAlpha.js`,
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      `export const apiGetActivityList = async (data) => ({\n` +
      `  data: await fetchApi.get('activity/list', data),\n` +
      `})\n`,
    expect: 1,
    keyword: 'config / status',
  },
  {
    name: 'apiReturn 三件齊全不誤報',
    file: `${A}/selfTestAlpha.js`,
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      `export const apiGetActivityList = async (data) => ({\n` +
      `  config: data,\n  status: 200,\n  data: await fetchApi.get('activity/list', data),\n` +
      `})\n`,
    expect: 0,
  },
  {
    // {id} 那一段是大小寫敏感的：一律大寫 ID
    name: 'apiNaming 路徑參數寫成 Id 要被抓',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetVoucherItemId = (data) => fetchApi.get('voucher/item/{id}', data)\n`,
    expect: 1,
    keyword: '大寫 ID',
  },
  {
    // 複合字的拆法工具推不出來，所以比對不分大小寫 —— 兩種寫法都放行
    name: 'apiNaming 複合字拆法不誤報',
    file: `${A}/selfTestAlpha.js`,
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      `export const apiGetPetPhotoLeaderBoard = (data) => fetchApi.get('petphoto/leaderboard', data)\n` +
      `export const apiGetPetknowledgeTop = (data) => fetchApi.get('petknowledge/top', data)\n`,
    expect: 0,
  },

  // ---------- 規則 storeLayer ----------
  //
  // 探測檔名要對得上真實存在的頁面資料夾，規則才會去讀它底下的頁面檔。
  // 那個資料夾由 onPrepare 建好，裡面放一支會呼叫 action 的 Detail.vue。
  {
    name: 'storeLayer 有打 api 的頁面沒有對應的層',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
    expect: 1,
    keyword: 'store 沒有對應的層',
  },
  {
    // 層名取頁面檔名，不是分類資料夾名 —— 兩者刻意取不同的字才驗得出來
    name: 'storeLayer 層名取頁面檔名，分類資料夾不佔一層',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const ${PROBE_PAGE_SUB_FOLDER} = ref(null)\n\n  return { ${PROBE_PAGE_SUB_FOLDER} }\n})\n`,
    expect: 1,
    keyword: 'store 沒有對應的層',
  },
  {
    name: 'storeLayer 分層齊全不誤報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const ${PROBE_PAGE_LAYER} = ref({ data: null })\n\n  return { ${PROBE_PAGE_LAYER} }\n})\n`,
    expect: 0,
  },
  {
    name: 'storeLayer 標了豁免註解就放行',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `/* lint-store-layer-exempt: 這份資料屬於別的層 */\nimport { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const list = ref(null)\n\n  return { list }\n})\n`,
    expect: 0,
  },
  {
    /* 兩支同名頁面分別在兩個分類資料夾底下。扁平的單一個 detail 等於兩頁共用
       同一份狀態，所以兩支都要報 —— 期望的是 alpha.detail 與 beta.detail。 */
    name: 'storeLayer 撞名時扁平的一層不夠',
    file: `${T}/${PROBE_PAGE_PLURAL}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestPetsStore = defineStore('selfTestPets', () => {\n  const ${PROBE_PAGE_LAYER} = ref({ data: null })\n\n  return { ${PROBE_PAGE_LAYER} }\n})\n`,
    expect: 1,
    keyword: `${PROBE_CLASH_FOLDER_A}.${PROBE_PAGE_LAYER}`,
  },
  {
    name: 'storeLayer 撞名時分類資料夾各佔一層就不報',
    file: `${T}/${PROBE_PAGE_PLURAL}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestPetsStore = defineStore('selfTestPets', () => {\n  const ${PROBE_CLASH_FOLDER_A} = ref({\n    ${PROBE_PAGE_LAYER}: { data: null },\n  })\n  const ${PROBE_CLASH_FOLDER_B} = ref({\n    ${PROBE_PAGE_LAYER}: { data: null },\n  })\n\n  return { ${PROBE_CLASH_FOLDER_A}, ${PROBE_CLASH_FOLDER_B} }\n})\n`,
    expect: 0,
  },
  {
    /* 資料夾那一層有了，但底下沒有這一頁的 key —— 那一層是別的東西，
       這一頁還是沒有自己的狀態。 */
    name: 'storeLayer 撞名時資料夾層底下缺頁面的 key',
    file: `${T}/${PROBE_PAGE_PLURAL}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestPetsStore = defineStore('selfTestPets', () => {\n  const ${PROBE_CLASH_FOLDER_A} = ref({\n    ${PROBE_PAGE_LAYER}: { data: null },\n  })\n  const ${PROBE_CLASH_FOLDER_B} = ref({\n    list: { data: null },\n  })\n\n  return { ${PROBE_CLASH_FOLDER_A}, ${PROBE_CLASH_FOLDER_B} }\n})\n`,
    expect: 1,
    keyword: `${PROBE_CLASH_FOLDER_B}.${PROBE_PAGE_LAYER}`,
  },

  // ---------- 規則 importOrder ----------
  //
  // 分組與順序來自設定(IMPORT_ORDER_GROUPS),所以探針的路徑也從設定算 ——
  // 寫死某個 alias 的話,換一個命名的專案這幾則會驗不到東西。
  {
    name: 'importOrder 依分組排列不誤報',
    rule: 'importOrder',
    file: `${C}/Order1.vue`,
    code: `<script setup>\n${orderedImportsOf().join('\n')}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 順序不符不報違規,存檔時直接排好(驗證在 SORT_IMPORT_CASES)——
       這則確認「順序亂掉」本身不會被報成違規,只剩樣式那一條。 */
    name: 'importOrder 順序不符不報違規',
    rule: 'importOrder',
    file: `${C}/Order2.vue`,
    code: (() => {
      const lines = orderedImportsOf()
      return `<script setup>\n${[...lines.slice(1), lines[0]].join('\n')}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`
    })(),
    expect: 0,
  },
  {
    name: 'importOrder 元件沒有載入樣式要報',
    rule: 'importOrder',
    file: `${C}/Order3.vue`,
    code: `<script setup>\nimport { computed } from 'vue'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '沒有載入樣式',
  },
  {
    /* 自己完全不寫 class 的轉手元件:設定往下傳,畫面與樣式都由被轉手的那支負責。
       它沒有樣式可以載入,報它的話只有兩條路 —— 去 import 別人的樣式,
       或建一支空的樣式檔,兩種都比違規本身更糟。 */
    /* 主檔取名 Main.vue 的話,使用端的名字會多出一段不帶資訊的字 ——
       讀的人看不出資料夾裡哪一支才是這個元件。 */
    name: 'vueFileName 元件主檔叫 Main.vue 要報',
    rule: 'vueFileName',
    file: `${C}/Main.vue`,
    code: probeVue,
    expect: 1,
    keyword: 'Index.vue',
  },
  {
    /* 元件在別的畫面裡是一個標籤,而標籤的慣例是大寫開頭 —— 
       檔名與標籤不一致的話,看到標籤要猜它在哪一支檔案。 */
    name: 'vueFileName 元件檔名首字小寫要報',
    rule: 'vueFileName',
    file: `${C}/index.vue`,
    code: probeVue,
    expect: 1,
    keyword: '首字要大寫',
  },
  {
    /* 頁面目錄的資料夾是網址的一段,而網址一向是小寫的。
       探針一律建在不帶底線的頁面資料夾底下 —— 用 PROBE 那個名字的話,
       它自己就是底線開頭,每一則都會先撞到下面那一條。 */
    name: 'viewFolder 資料夾首字大寫要報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/Detail/index.vue`,
    code: probeVue,
    expect: 1,
    keyword: '首字要小寫',
  },
  {
    /* 底線資料夾不是網址的一段,允許的名字列在設定裡 —— 開放自由命名的話,
       那個例外會愈開愈大,而每一個都要讀的人自己猜它算不算網址。 */
    name: 'viewFolder 底線資料夾不在清單裡要報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/_pages/Probe.vue`,
    code: probeVue,
    expect: 1,
    keyword: VIEW_UNDERSCORE_FOLDERS.join('、'),
  },
  {
    name: 'viewFolder 清單裡的底線資料夾不誤報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/${VIEW_UNDERSCORE_FOLDERS[0]}/Probe.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    /* 底線那一層不是網址,**它底下的層級也不是** —— 那裡面放的是元件,
       分類資料夾跟著元件那一套(首字大寫)。拿頁面那一套去要求它改成小寫的話,
       會變成「大寫的元件裝在小寫的資料夾裡」,與元件命名那條互相矛盾。 */
    name: 'viewFolder 底線資料夾底下的分類層不誤報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/${VIEW_UNDERSCORE_FOLDERS[0]}/Edit/Probe.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    /* 底線資料夾自己的名字照舊檢查 —— 停止往下檢查的是它**底下**那幾層 */
    name: 'viewFolder 不在清單裡的底線資料夾照樣要報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/_unknownProbe/Edit/Probe.vue`,
    code: probeVue,
    expect: 1,
    keyword: VIEW_UNDERSCORE_FOLDERS.join('、'),
  },
  {
    /* 資料夾的分隔方式與同一層的 .vue 檔名同一套 —— 兩者都在回答
       「這一段是不是網址」。資料夾寬、檔案嚴的話,同一個名字寫成資料夾就過、
       寫成檔案就報。檔案系統路由的專案裡那一層就是網址,連字號放行。 */
    name: 'viewFolder 資料夾帶連字號依網址從哪裡來決定',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/probe-detail/index.vue`,
    code: probeVue,
    expect: IS_FILE_BASED_ROUTING ? 0 : 1,
    ...(IS_FILE_BASED_ROUTING ? {} : { keyword: '駝峰' }),
  },
  {
    /* 連續大寫兩種專案都擋:網址裡的大寫在有的伺服器上不分大小寫,
       同一個畫面會有兩個網址進得去。 */
    name: 'viewFolder 資料夾連續大寫一律要報',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/probeQRCode/index.vue`,
    code: probeVue,
    expect: 1,
  },
  {
    /* 點開頭的資料夾是另一套慣例(放 composable 那種),不受這條約束。 */
    name: 'viewFolder 點開頭的資料夾放行',
    rule: 'viewFolder',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/.composables/probe.js`,
    code: `export const useProbe = () => ({})\n`,
    expect: 0,
  },
  {
    /* 只看首字大小寫的話,連字號、底線、連續大寫都會通過 ——
       同一個專案裡好幾種分隔方式並存時,找一支檔案要先想它是哪一種寫法。 */
    name: 'vueFileName 檔名不是駝峰要報',
    rule: 'vueFileName',
    file: `${C}/Probe-Item.vue`,
    code: probeVue,
    expect: 1,
    keyword: '駝峰',
  },
  {
    name: 'vueFileName 連續大寫要報',
    rule: 'vueFileName',
    file: `${C}/QRCode.vue`,
    code: probeVue,
    expect: 1,
    keyword: '駝峰',
  },
  {
    name: 'vueFileName 駝峰不誤報',
    rule: 'vueFileName',
    file: `${C}/QrCode.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    /* 模組 css 的 class 前綴是從資料夾名推出來的,兩者對不上的話那一側
       會推出一個沒有人在用的前綴 —— 而沒有樣式檔的元件連那個訊息都沒有。 */
    name: 'componentClass 資料夾名對不上 template 的 class',
    rule: 'componentClass',
    file: `${SC}/Index.vue`,
    code: `<template>\n  <div class="m-css-self-text"></div>\n</template>\n`,
    expect: 1,
    keyword: 'm-css-self-test',
  },
  {
    name: 'componentClass 對得上就不誤報',
    rule: 'componentClass',
    file: `${SC}/Index.vue`,
    code: `<template>\n  <div class="m-css-self-test"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 底下的子元素照樣是這個模組的 class,不是別的模組。 */
    name: 'componentClass 子元素的 class 帶著母體前綴,不誤報',
    rule: 'componentClass',
    file: `${SC}/Item.vue`,
    code: `<template>\n  <li class="m-css-self-test-item"></li>\n</template>\n`,
    expect: 0,
  },
  {
    /* 自己完全不寫 class 的轉手型元件沒有 class 可以對,這條的前提不成立。 */
    name: 'componentClass 轉手型元件不受這條約束',
    rule: 'componentClass',
    file: `${SC}/Pass.vue`,
    code: `<template>\n  <CommonMPopup :setClass="{ main: '--px-20' }">\n    <slot />\n  </CommonMPopup>\n</template>\n`,
    expect: 0,
  },
  {
    /* 一支元件遲早會有樣式、子元件,那時才建資料夾就要動到每一個使用端
       (自動注入的名稱跟著路徑走)。 */
    name: 'componentFolder 直接放在分類資料夾底下要報',
    rule: 'componentFolder',
    /* 探測檔一律放在探測目錄底下(那幾層 cleanup 會清掉)——
       放在元件目錄第一層的話,跑完一次就留一支沒有人認得的 .vue 在專案裡。
       這個資料夾名不是 m 開頭,對這條規則來說就是「分類層」,驗得到同一件事。 */
    file: `${C}/Loose.vue`,
    code: probeVue,
    expect: 1,
    keyword: '自己的資料夾',
  },
  {
    /* 同一個模組底下好幾支是正常的 —— 那個資料夾就是元件本身,不是分類。 */
    name: 'componentFolder 模組資料夾底下的子檔案不誤報',
    rule: 'componentFolder',
    file: `${SC}/Item.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    /* 一個模組底下再分子資料夾是正常的(把彈窗、面板各收成一疊)。
       只看上一層的話這種檔案會被要求再包一層 Index.vue —— 名字沒變、位置更深,
       那個判斷仍然不成立,下一次照樣報。 */
    name: 'componentFolder 模組再分子資料夾也不誤報',
    rule: 'componentFolder',
    file: `${SC}/popup/Delete.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    name: 'vueFileName 元件主檔叫 Index.vue 不誤報',
    rule: 'vueFileName',
    file: `${C}/Index.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    name: 'vueFileName 頁面檔名首字大寫要報',
    rule: 'vueFileName',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/ProbeDetail.vue`,
    code: probeVue,
    expect: 1,
    keyword: '首字要小寫',
  },
  {
    /* 頁面目錄底下,底線開頭的資料夾裡放的不是頁面(元件、片段那些),
       所以那裡面的檔案照元件那一套命名。 */
    name: 'vueFileName 頁面底下底線資料夾裡的照元件那一套',
    rule: 'vueFileName',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/_components/Form.vue`,
    code: probeVue,
    expect: 0,
  },
  {
    /* 頁面檔名可以怎麼取,看的是網址從哪裡來。檔案系統路由的專案裡,
       檔名就是網址的一段 —— 連字號是網址分隔字詞的寫法,要求改成駝峰
       等於要求把網址改掉,既有的連結會失效。自己寫路由表的專案沒有這回事:
       `path` 與檔名各寫各的,檔名只是內部的名字,照駝峰那一套。 */
    name: 'vueFileName 頁面檔名帶連字號依網址從哪裡來決定',
    rule: 'vueFileName',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/probe-detail.vue`,
    code: probeVue,
    expect: IS_FILE_BASED_ROUTING ? 0 : 1,
    ...(IS_FILE_BASED_ROUTING ? {} : { keyword: '駝峰' }),
  },
  {
    /* 底線兩種專案都擋:網址用連字號分隔字詞,底線不是那個慣例;
       自己寫路由表的專案則是連字號與底線都不用。 */
    name: 'vueFileName 頁面檔名帶底線一律要報',
    rule: 'vueFileName',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/probe_detail.vue`,
    code: probeVue,
    expect: 1,
  },
  {
    /* 連續大寫兩種專案都擋:網址裡的大寫在有的伺服器上不分大小寫,
       同一個畫面會有兩個網址進得去。 */
    name: 'vueFileName 頁面檔名連續大寫一律要報',
    rule: 'vueFileName',
    file: `${viewResourceDir(PROBE_PAGE_ALPHA)}/probeQRCode.vue`,
    code: probeVue,
    expect: 1,
  },
  {
    /* 一個迴圈跑出來、名字裡沒有迭代變數 —— 那幾個是同一個欄位的幾個選項,
       每一個都自己驗的話,同一句訊息會在畫面上重複好幾行。 */
    name: 'formGroupValidate 一組控制項各自帶驗證要報',
    rule: 'formGroupValidate',
    needs: 'formGroupValidator',
    file: `${C}/GroupProbe.vue`,
    code:
      `<template>\n  <div class="m-probe">\n` +
      `    <ProbeControl name="probe" :rules="rules" v-for="(item, i) in items" :key="i" />\n` +
      `  </div>\n</template>\n`,
    expect: 1,
    keyword: '各自帶了驗證',
  },
  {
    /* 名字裡帶了迭代變數 → 每一個都是獨立的欄位,各自驗證是對的 */
    name: 'formGroupValidate 名字帶迭代變數不誤報',
    rule: 'formGroupValidate',
    needs: 'formGroupValidator',
    file: `${C}/GroupProbeNamed.vue`,
    code:
      `<template>\n  <div class="m-probe">\n` +
      `    <ProbeControl :name="\`probe-\${i}\`" :rules="rules" v-for="(item, i) in items" :key="i" />\n` +
      `  </div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 驗證掛在外層、控制項自己不帶 rules —— 正是這條要的寫法 */
    name: 'formGroupValidate 驗證掛在外層不誤報',
    rule: 'formGroupValidate',
    needs: 'formGroupValidator',
    file: `${C}/GroupProbeWrapped.vue`,
    code:
      `<template>\n  <div class="m-probe">\n` +
      `    <ProbeControl name="probe" v-for="(item, i) in items" :key="i" />\n` +
      `  </div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'vueFileName 元件子檔首字大寫不誤報',
    rule: 'vueFileName',
    file: `${C}/Promise.vue`,
    code: `<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'importOrder 自己不寫 class 的轉手元件不必載入樣式',
    rule: 'importOrder',
    file: `${C}/Order4.vue`,
    code: `<template>\n  <CommonProbeInner :config="config">\n    <slot />\n  </CommonProbeInner>\n</template>\n`,
    expect: 0,
  },
  {
    /* 寫了 class,但那幾個名字全案都沒有對應的樣式 —— 外觀完全由使用端傳進來,
       那幾個 class 只是掛載點。它同樣沒有樣式可載,照著補就得建一支空的樣式檔。
       所以判準是「寫出來的那幾個有沒有人在定義」,不是「有沒有寫 class」。 */
    name: 'importOrder 只當掛載點、沒有人定義樣式的 class 不算',
    rule: 'importOrder',
    file: `${C}/Order5.vue`,
    code: `<template>\n  <div class="${PROBE}-mount-only">\n    <slot />\n  </div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 動態綁定的 class 由使用端傳進來,樣式該由傳進來的那一方負責 ——
       只有這種的元件同樣算沒有自己的 class。 */
    name: 'importOrder 只有動態綁定 class 的元件也算轉手',
    rule: 'importOrder',
    file: `${C}/Order5.vue`,
    code: `<template>\n  <CommonProbeInner :class="setClass.main" />\n</template>\n`,
    expect: 0,
  },
  {
    /* 被註解掉的那一段是死程式碼,裡面的 class 不會產生任何樣式 ——
       拿它當「這支有自己的樣式」的證據,會讓真正該報的那一支被放過。 */
    name: 'importOrder 只有註解掉的 class 不算有自己的樣式',
    rule: 'importOrder',
    file: `${C}/Order6.vue`,
    code: `<template>\n  <!-- <div class="m-probe"></div> -->\n  <CommonProbeInner />\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 importAlias / deprecated / composableOrder ----------
  {
    /* 路徑與預期的 alias 都從專案設定算出來 —— 每個專案的 api 目錄位置與
      alias 名稱都不一樣,寫死的話換一個專案這則永遠不會命中,看起來像規則壞了。 */
    /* 標了豁免才只驗得到 import 路徑那一條 —— 這段程式碼 import 的是 api,
       同時也會觸發「頁面直接 import api」。兩條規則混在一則案例裡的話,
       其中一條的行為改了,另一條的案例也會跟著失敗,看不出是誰壞了。 */
    /* 只計 importAlias —— 資源在第二層的專案,探針的相對路徑會多跳一層,
       深到會被「跨專案引用」那條一起抓。那是另一條規則的判定,不該讓這則跟著失敗。 */
    name: 'importAlias 相對路徑跳出資料夾',
    rule: 'importAlias',
    file: `${P}/detail.vue`,
    code: `<script setup>\n/* lint-page-api-exempt: 這則在驗 import 路徑的寫法 */\nimport { onDo } from '${apiImportPathOf(P, 'home.js')}'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'home.js',
  },
  {
    /* 一次收一整批檔案的那種呼叫,吃的也是路徑 —— 只看 import 語句的話它完全不被檢查,
       而這種路徑失效時**不會報錯**:收到的是空的一批,用它的地方靜靜地拿不到東西。
       只計 importAlias —— 探針的相對路徑在某些擺法下會深到被別條一起抓。 */
    name: 'importAlias 一次收一批的呼叫也要用 alias',
    rule: 'importAlias',
    file: `${P}/globProbe.vue`,
    code: `<script setup>\nconst MAP = import.meta.glob('${apiImportPathOf(P, '*.js')}', { eager: true })\n</script>\n\n<template>\n  <div class="m-probe">{{ MAP }}</div>\n</template>\n`,
    expect: 1,
    keyword: '*.js',
  },
  {
    /* var(--不存在) 不會報錯,瀏覽器把整條宣告丟掉就算了 —— 畫面上那一段樣式
       整片消失,而每一個檢查工具都顯示通過。最常踩到的時機是把元件搬到
       色票命名不同的專案。 */
    name: 'unknownVar 引用不到定義的變數要報',
    rule: 'unknownVar',
    file: `${M}/probeUnknownVar.css`,
    code: `.m-probe {\n  color: var(--probe-never-defined-anywhere);\n}\n`,
    expect: 1,
    keyword: '找不到定義',
  },
  {
    /* 帶後備值是刻意的寫法 —— 變數沒有時用後備值,樣式不會消失 */
    name: 'unknownVar 有後備值不誤報',
    rule: 'unknownVar',
    file: `${M}/probeFallbackVar.css`,
    code: `.m-probe {\n  padding: var(--probe-never-defined-anywhere, 8px);\n}\n`,
    expect: 0,
  },
  {
    /* 方括號那種引用(`text-[--x]`)編譯出來就是 var(),壞掉的方式一模一樣。
       少看這一種的話,元件的畫面區段與 @apply 那一大片引用全部不會被檢查 ——
       而那正是最常整批換名、最常漏掉的地方。 */
    name: 'unknownVar 方括號寫的引用也要檢查',
    rule: 'unknownVar',
    file: `${M}/probeArbitraryVar.css`,
    code: `.m-probe {\n  @apply text-[--probe-never-defined-anywhere];\n}\n`,
    expect: 1,
    keyword: '找不到定義',
  },
  {
    /* 元件動態綁定的 `'--x': 值` 也是定義 —— 少認它的話,
       那些由程式算出來的尺寸會被整批誤報,而它們完全正確。 */
    name: 'unknownVar 元件動態綁定的變數算有定義',
    rule: 'unknownVar',
    file: `${C}/VarProbe.vue`,
    code:
      `<script setup>\nconst style = { '--probe-runtime-size': '10px' }\n</script>\n\n` +
      `<template>\n  <div class="m-probe" :style="style">{{ style }}</div>\n</template>\n\n` +
      `<style>\n.m-probe {\n  width: var(--probe-runtime-size);\n}\n</style>\n`,
    expect: 0,
  },
  {
    name: 'importAlias 同層相對路徑不誤報',
    file: `${P}/list.vue`,
    code: `<script setup>\n/* lint-page-api-exempt: 這則在驗 import 路徑的寫法 */\nimport { onDo } from './.composables/useDo.js'\nimport { fetchApi } from '@js/_api/.config.js'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'deprecated apiParams 已淘汰',
    file: `${T}/.composables/useCommonActions.js`,
    code: `export const useCommonActions = () => {\n  const onDo = () => {\n    const config = { apiParams: { id: 1 } }\n\n    return config\n  }\n\n  return { onDo }\n}\n`,
    expect: 1,
    keyword: 'apiParams 已淘汰',
  },
  {
    // bare 透傳同時也違反 storeActionReturn（沒有回傳那三件），所以是 3 筆
    name: 'deprecated actions 內的 console.log 與 bare 透傳',
    file: `${T}/.composables/useJsonActions.js`,
    code: `export const useJsonActions = () => {\n  const onApiJsonGet = async () => {\n    console.log('debug')\n\n    return await apiJsonGet({})\n  }\n\n  return { onApiJsonGet }\n}\n`,
    expect: 3,
    keyword: 'console.log',
  },
  {
    name: 'deprecated 註解掉的不算',
    file: `${T}/.composables/usePopupActions.js`,
    code: `export const usePopupActions = () => {\n  // console.log('舊的除錯')\n  // apiParams: { id: 1 }\n  const onReset = () => {}\n\n  return { onReset }\n}\n`,
    expect: 0,
  },
  {
    /* 宣告順序不報違規,存檔時直接排好 —— 驗證在 SORT_COMPOSABLE_CASES。
      這則確認它**不會**產生違規訊息:順序倒置的檔案掃出來要是 0 筆。 */
    name: 'composableOrder 順序倒置不報違規(改為自動排序)',
    file: `${P}/order.vue`,
    code: `<script setup>\nconst popup = usePopupStore()\nconst common = useCommonStore()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 storeActionNaming ----------
  //
  // endpoint 裡有底線時，api 那層照著寫（名字與網址一眼對得起來），
  // action 那層去掉底線（那是程式裡到處被呼叫的識別字）。
  // 兩層只差這一個符號，不該被判成「名稱對不上」。
  {
    name: 'storeActionNaming api 有底線、action 沒有，不算對不上',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code:
      `export const useSelfTestAlphaActions = () => {\n` +
      `  const onApiPostQuestionnaireQ31 = async () => {\n` +
      `    const { config, status, data } = await apiPostQuestionnaireQ31({})\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiPostQuestionnaireQ31 }\n` +
      `}\n`,
    expect: 0,
  },
  {
    // 忽略底線不等於忽略其他差異 —— 名字真的對不上還是要報
    name: 'storeActionNaming 忽略底線不會放過真正對不上的名字',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code:
      `export const useSelfTestAlphaActions = () => {\n` +
      `  const onApiPostQuestionnaireQ99 = async () => {\n` +
      `    const { config, status, data } = await apiPostQuestionnaireQ31({})\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiPostQuestionnaireQ99 }\n` +
      `}\n`,
    expect: 1,
    keyword: 'apiPostQuestionnaireQ31',
  },
  {
    // 回傳寫完整，才不會同時命中 storeActionReturn（那條另有案例）
    name: 'storeActionNaming 呼叫 api 卻沒有 onApi 前綴',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code: `export const useHomeActions = () => {\n  const getList = async () => {\n    const { config, status, data } = await apiActivityListGet({})\n\n    return { config, status, data }\n  }\n\n  return { getList }\n}\n`,
    expect: 1,
    keyword: 'onApiActivityListGet',
  },
  {
    name: 'storeActionNaming 名稱對不上呼叫的 api',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code: `export const useMemberActions = () => {\n  const onApiMemberInfoGet = async () => {\n    const { config, status, data } = await apiMemberPointGet({})\n\n    return { config, status, data }\n  }\n\n  return { onApiMemberInfoGet }\n}\n`,
    expect: 1,
    keyword: 'onApiMemberPointGet',
  },
  {
    name: 'storeActionNaming 正確命名不誤報',
    file: `${T}/.composables/useEventsActions.js`,
    code: `export const useEventsActions = () => {\n  const onApiActivityListGet = async () => {\n    const { config, status, data } = await apiActivityListGet({})\n\n    return { config, status, data }\n  }\n\n  return { onApiActivityListGet }\n}\n`,
    expect: 0,
  },
  {
    name: 'storeActionNaming 沒呼叫 api 的 action 不受這條限制',
    file: `${T}/.composables/usePopupActions.js`,
    code: `export const usePopupActions = () => {\n  const onReset = () => {}\n  const isOpen = () => true\n\n  return { onReset, isOpen }\n}\n`,
    expect: 0,
  },
  {
    // 一個 action 打多支 api 時無法斷定該用哪一支的名字，只驗前綴
    name: 'storeActionNaming 多支 api 只驗前綴',
    file: `${T}/.composables/useExchangeActions.js`,
    code: `export const useExchangeActions = () => {\n  const onApiExchangeFlow = async () => {\n    await apiVoucherItemGet({})\n\n    const { config, status, data } = await apiVoucherItemPost({})\n\n    return { config, status, data }\n  }\n\n  return { onApiExchangeFlow }\n}\n`,
    expect: 0,
  },
  {
    /* 兩個 action 打同一支 api，各自寫進不同層 —— 名字要帶上層名才分得開。
       共用一個 action 的話，兩頁就共用同一份狀態。 */
    name: 'storeActionNaming 同一支 api 兩個 action 要帶層名',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code:
      `export const useSelfTestAlphaActions = () => {\n` +
      `  const onApiVoucherListGet = async () => {\n` +
      `    const { config, status, data } = await apiVoucherListGet({})\n\n` +
      `    index.value.data = data\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  const onApiVoucherListGetDetail = async () => {\n` +
      `    const { config, status, data } = await apiVoucherListGet({})\n\n` +
      `    detail.value.data = data\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiVoucherListGet, onApiVoucherListGetDetail }\n` +
      `}\n`,
    expect: 1,
    keyword: 'onApiVoucherListGetIndex',
  },
  {
    name: 'storeActionNaming 同一支 api 兩個 action 都帶了層名就不報',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code:
      `export const useSelfTestAlphaActions = () => {\n` +
      `  const onApiVoucherListGetIndex = async () => {\n` +
      `    const { config, status, data } = await apiVoucherListGet({})\n\n` +
      `    index.value.data = data\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  const onApiVoucherListGetDetail = async () => {\n` +
      `    const { config, status, data } = await apiVoucherListGet({})\n\n` +
      `    detail.value.data = data\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiVoucherListGetIndex, onApiVoucherListGetDetail }\n` +
      `}\n`,
    expect: 0,
  },
  {
    /* 一支 api 只有一個 action 在用 —— 名字維持最短，不要求帶層名。
       只在需要分辨的時候才變長。 */
    name: 'storeActionNaming 單一使用者不必帶層名',
    file: `${T}/.composables/useEventsActions.js`,
    code:
      `export const useEventsActions = () => {\n` +
      `  const onApiVoucherListGet = async () => {\n` +
      `    const { config, status, data } = await apiVoucherListGet({})\n\n` +
      `    index.value.data = data\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiVoucherListGet }\n` +
      `}\n`,
    expect: 0,
  },

  // ---------- 規則 storeApiDefault / storeResetDefault ----------
  {
    name: 'storeApiDefault 有 apiData 卻沒有 apiDefault',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const detail = ref({ apiData: null })\n\n  return { detail }\n})\n`,
    expect: 1,
    keyword: '沒有 apiDefault',
  },
  // ---------- 規則 componentDeps ----------
  {
    /* 自己讀 store 的元件不是自足的:複製它的資料夾過去,那支 store 不會跟著走,
       而畫面上看不出少了什麼 —— 只是永遠不顯示。 */
    rule: 'componentDeps',
    name: 'componentDeps 讀了 store 卻沒列在檔頭要報',
    file: `${C}/Deps1.vue`,
    code: `<script setup>\nconst probe = use${pascalOf(PROBE_DEPS_PAGE)}Store()\n</script>\n\n<template>\n  <div class="m-probe">{{ probe }}</div>\n</template>\n`,
    context: {
      [`${T}/${PROBE_DEPS_PAGE}.js`]: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_DEPS_PAGE)}Store = defineStore('${PROBE_DEPS_PAGE}', () => {\n  const detail = ref(null)\n\n  return { detail }\n})\n`,
    },
    expect: 1,
    keyword: 'component-deps',
  },
  {
    rule: 'componentDeps',
    name: 'componentDeps 檔頭列齊了就不報',
    file: `${C}/Deps2.vue`,
    code: `<script setup>\n/* component-deps —— 複製這支元件時要一起帶走:\n   ${T}/${PROBE_DEPS_PAGE}.js */\nconst probe = use${pascalOf(PROBE_DEPS_PAGE)}Store()\n</script>\n\n<template>\n  <div class="m-probe">{{ probe }}</div>\n</template>\n`,
    context: {
      [`${T}/${PROBE_DEPS_PAGE}.js`]: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_DEPS_PAGE)}Store = defineStore('${PROBE_DEPS_PAGE}', () => {\n  const detail = ref(null)\n\n  return { detail }\n})\n`,
    },
    expect: 0,
  },
  {
    /* 自足的元件不必列 —— 每一支都要寫一段的話,真正該看的那幾支會被淹掉。 */
    rule: 'componentDeps',
    name: 'componentDeps 自足的元件不必列',
    file: `${C}/Deps3.vue`,
    code: `<script setup>\nconst props = defineProps({ text: { type: String, default: '' } })\n</script>\n\n<template>\n  <div class="m-probe">{{ props.text }}</div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 清單會過期:元件不再讀那支 store 之後,留著的那一行會讓人多複製一份用不到的東西。 */
    rule: 'componentDeps',
    name: 'componentDeps 清單過期要報',
    file: `${C}/Deps4.vue`,
    code: `<script setup>\n/* component-deps: ${T}/${PROBE_PAGE_ALPHA}.js */\nconst props = defineProps({ text: { type: String, default: '' } })\n</script>\n\n<template>\n  <div class="m-probe">{{ props.text }}</div>\n</template>\n`,
    expect: 1,
    keyword: '清單過期',
  },

  // ---------- 規則 spacerElement ----------
  {
    rule: 'spacerElement',
    name: 'spacerElement 只有空白的元素要報',
    file: `${C}/Spacer1.vue`,
    code: `<template>\n  <div class="m-probe"><b>甲</b><span> </span><b>乙</b></div>\n</template>\n`,
    expect: 1,
    keyword: '編譯時就被移除',
  },
  {
    /* 有內容的元素不算 —— 這條抓的是「裡面只有空白」的那一種。 */
    rule: 'spacerElement',
    name: 'spacerElement 有內容的元素不誤報',
    file: `${C}/Spacer2.vue`,
    code: `<template>\n  <div class="m-probe"><span>甲</span></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* pre 與 textarea 裡的空白是內容的一部分,編譯器不會動它。 */
    rule: 'spacerElement',
    name: 'spacerElement 空白有意義的標籤不受約束',
    file: `${C}/Spacer3.vue`,
    code: `<template>\n  <div class="m-probe"><pre> </pre></div>\n</template>\n`,
    expect: 0,
  },
  {
    rule: 'spacerElement',
    name: 'spacerElement 兩個元素之間的空白要報',
    file: `${C}/Spacer5.vue`,
    code: `<template>\n  <div class="m-probe"><b>甲</b> <b>乙</b></div>\n</template>\n`,
    expect: 1,
    keyword: '折成兩行',
  },
  {
    /* 折行的空白在編譯時整個被移除,那種寫法本來就沒有在靠空白排版。 */
    rule: 'spacerElement',
    name: 'spacerElement 換行不算靠空白排版',
    file: `${C}/Spacer6.vue`,
    code: `<template>\n  <div class="m-probe">\n    <b>甲</b>\n    <b>乙</b>\n  </div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 元素後面接的是文字時,那個空白是文案的一部分。 */
    rule: 'spacerElement',
    name: 'spacerElement 元素後面接文字不誤報',
    file: `${C}/Spacer7.vue`,
    code: `<template>\n  <div class="m-probe"><b>甲</b> 乙</div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 被註解掉的畫面區段是死程式碼。 */
    rule: 'spacerElement',
    name: 'spacerElement 註解掉的不算',
    file: `${C}/Spacer4.vue`,
    code: `<template>\n  <div class="m-probe">\n    <!-- <span> </span> -->\n  </div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 apiTryCatch / apiPathParam ----------
  {
    rule: 'apiTryCatch',
    name: 'apiTryCatch api 自己包 try/catch 要報',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetSelfTestAlpha = async (data) => {\n  try {\n    return await fetchApi.get('selftestalpha', data)\n  } catch {\n    return null\n  }\n}\n`,
    expect: 1,
    keyword: 'try/catch',
  },
  {
    rule: 'apiTryCatch',
    name: 'apiTryCatch 直接回傳不誤報',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetSelfTestAlpha = (data) => fetchApi.get('selftestalpha', data)\n`,
    expect: 0,
  },
  {
    /* 註解裡寫出一段示範的 try 是說明,不是程式碼。 */
    rule: 'apiTryCatch',
    name: 'apiTryCatch 註解裡的不算',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\n// 不要寫成 try {\nexport const apiGetSelfTestAlpha = (data) => fetchApi.get('selftestalpha', data)\n`,
    expect: 0,
  },
  {
    rule: 'apiPathParam',
    name: 'apiPathParam 端點用拼接要報',
    file: `${A}/selfTestAlpha.js`,
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      'export const apiGetSelfTestAlphaID = (data) => fetchApi.get(`selftestalpha/${data.id}`)\n',
    expect: 1,
    keyword: '{key}',
  },
  {
    rule: 'apiPathParam',
    name: 'apiPathParam {key} 模板不誤報',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetSelfTestAlphaID = (data) => fetchApi.get('selftestalpha/{id}', data)\n`,
    expect: 0,
  },

  // ---------- 規則 customField ----------
  {
    /* 規格文件裡沒有這個名字 —— 那是前端自己掛上去的,要加底線。 */
    rule: 'customField',
    needs: 'apiSpec',
    name: 'customField 文件裡沒有的欄位要加底線',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `const onProbe = (store) => {\n  store.detail.apiData.${apiSpecFields?.unknown} = true\n}\n`,
    expect: 1,
    keyword: apiSpecFields?.unknown,
  },
  {
    /* 後端真的有這個欄位,那是寫回去,不是自訂的 —— 加底線反而錯。 */
    rule: 'customField',
    needs: 'apiSpec',
    name: 'customField 文件裡有的欄位不誤報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `const onProbe = (store) => {\n  store.detail.apiData.${apiSpecFields?.known} = true\n}\n`,
    expect: 0,
  },
  {
    /* 加了底線就是宣告「這是前端自己的」,名字在不在文件裡都不必再問。 */
    rule: 'customField',
    needs: 'apiSpec',
    name: 'customField 加了底線就不報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `const onProbe = (store) => {\n  store.detail.apiData._${apiSpecFields?.unknown} = true\n}\n`,
    expect: 0,
  },
  {
    /* `data` 是很通用的名字,第三方套件的事件物件也用它 —— 那是別人的介面,
       改名等於改壞,所以要有一個出口。 */
    rule: 'customField',
    needs: 'apiSpec',
    name: 'customField 檔頭標了豁免就放行',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `// lint-custom-field-exempt: 這裡的 data 是第三方編輯器的事件物件,不是 api 資料\n\nconst onProbe = (e) => {\n  e.data.${apiSpecFields?.unknown} = true\n}\n`,
    expect: 0,
  },
  {
    /* 只看 api 資料那兩個容器底下 —— 一般的畫面狀態不受這條約束,
       它們本來就不是後端給的東西,每一個都要加底線的話整支檔案都是違規。 */
    rule: 'customField',
    needs: 'apiSpec',
    name: 'customField 不是 api 資料的物件不受約束',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `const onProbe = (state) => {\n  state.panel.${apiSpecFields?.unknown} = true\n}\n`,
    expect: 0,
  },
  {
    /* 會出事的是「那一層有陣列」加上「有人用展開一層還原它」兩件事同時成立。
       只看其中一件的話,報出來的那一筆在還原處寫對的情況下也消不掉,
       而修不掉的違規會讓整份清單被當成背景雜訊。 */
    rule: 'storeDefaultClone',
    needs: 'deepCloneHelper',
    name: 'storeDefaultClone 有陣列而且有人展開一層還原',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null, ItemList: [] } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    context: {
      [`${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_PAGE_ALPHA)}Actions.js`]: `export const use${pascalOf(PROBE_PAGE_ALPHA)}Actions = () => {\n  const onReset = (store) => {\n    store.detail.apiData = { ...store.apiDefault.detail }\n  }\n\n  return { onReset }\n}\n`,
    },
    expect: 1,
    keyword: 'ItemList',
  },
  {
    /* 還原處已經深拷貝了就沒有問題 —— 這一則是這條規則最重要的那一半:
       寫對了要能消得掉,否則它就只是一句永遠在的提醒。 */
    rule: 'storeDefaultClone',
    needs: 'deepCloneHelper',
    name: 'storeDefaultClone 還原處已經深拷貝就不報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null, ItemList: [] } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    context: {
      [`${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_PAGE_ALPHA)}Actions.js`]: `import { ${DEEP_CLONE_HELPER.name} } from '${DEEP_CLONE_HELPER.source}'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Actions = () => {\n  const onReset = (store) => {\n    store.detail.apiData = ${DEEP_CLONE_HELPER.name}(store.apiDefault.detail)\n  }\n\n  return { onReset }\n}\n`,
    },
    expect: 0,
  },
  {
    /* 沒有人還原那一層的話,那個陣列不會被複製到任何地方 —— 沒有可出事的地方。 */
    rule: 'storeDefaultClone',
    needs: 'deepCloneHelper',
    name: 'storeDefaultClone 沒有人還原就不報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null, ItemList: [] } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    expect: 0,
  },
  {
    /* 整份展開(`{ ...store.apiDefault }`)沒有指名哪一層,
       所以每一層都被複製到 —— 有陣列的那一層照樣會出事。 */
    rule: 'storeDefaultClone',
    needs: 'deepCloneHelper',
    name: 'storeDefaultClone 整份展開也算命中',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null, ItemList: [] } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    context: {
      [`${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_PAGE_ALPHA)}Actions.js`]: `export const use${pascalOf(PROBE_PAGE_ALPHA)}Actions = () => {\n  const onReset = (store) => {\n    store.detail.apiData = { ...store.apiDefault }\n  }\n\n  return { onReset }\n}\n`,
    },
    expect: 1,
    keyword: 'ItemList',
  },
  {
    /* 全是單純值的那一層不必深拷貝 —— 每一支 store 都提醒一次的話,
       真正該看的那幾筆會被淹掉。 */
    rule: 'storeDefaultClone',
    needs: 'deepCloneHelper',
    name: 'storeDefaultClone 沒有陣列就不報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null, Name: null } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    context: {
      [`${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_PAGE_ALPHA)}Actions.js`]: `export const use${pascalOf(PROBE_PAGE_ALPHA)}Actions = () => {\n  const onReset = (store) => {\n    store.detail.apiData = { ...store.apiDefault.detail }\n  }\n\n  return { onReset }\n}\n`,
    },
    expect: 0,
  },
  {
    name: 'storeApiDefault 有 apiDefault 不誤報',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_PAGE_ALPHA)}Store = defineStore('${PROBE_PAGE_ALPHA}', () => {\n  const apiDefault = readonly({ detail: { Id: null } })\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    expect: 0,
  },
  {
    /* apiDefault 是「還原用的原始值」，沒包 readonly 的話任何一次寫入都會改掉它，
      之後每次 reset 都還原成被改過的值 —— 而且完全沒有徵兆 */
    /* 檔名用探測資料夾的名字,不要寫死專案設定裡的 store 名 ——
       那份名單(STANDALONE_STORES)每個專案不一樣,寫死的話案例搬到別的專案
       會多報一筆「檔名對不上資料夾」,看起來像規則壞了,其實是案例綁死了設定。
       探測資料夾是 self-test 自己在頁面目錄底下建的,任何專案都對得上。 */
    name: 'storeApiDefault 沒包 readonly 要被抓',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const apiDefault = { detail: { Id: null } }\n  const detail = ref({ apiData: null })\n\n  return { apiDefault, detail }\n})\n`,
    expect: 1,
    keyword: 'readonly',
  },
  {
    /* 只讀不送的 store:有 data 沒有 apiData,所以不需要 apiDefault。
       層本身要有 —— 探測資料夾裡有一支會打 api 的頁面,少了那一層會被
       storeLayer 抓到,那樣這一則就同時牽扯到兩條規則了。 */
    name: 'storeApiDefault 沒有 apiData 的 store 不受限制',
    file: `${T}/${PROBE_PAGE_ALPHA}.js`,
    code: `import { defineStore } from 'pinia'\n\nexport const useSelfTestAlphaStore = defineStore('selfTestAlpha', () => {\n  const detail = ref({ data: null })\n\n  return { detail }\n})\n`,
    expect: 0,
  },
  {
    name: 'storeResetDefault reset 手寫預設值',
    file: `${T}/.composables/useCommonActions.js`,
    code: `export const useCommonActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { Amount: 1, Id: null }\n  }\n\n  return { onReset }\n}\n`,
    expect: 1,
    keyword: '手寫了預設值',
  },
  {
    name: 'storeResetDefault 用 apiDefault 展開不誤報',
    file: `${T}/.composables/usePopupActions.js`,
    code: `export const usePopupActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { ...store.apiDefault.detail }\n    other.value.apiData = null\n  }\n\n  return { onReset }\n}\n`,
    expect: 0,
  },

  {
    /* 「先指定要操作誰,再讓使用者填細節」的流程裡,重設要留著操作對象。
       展開之後把它帶回去仍然只有一份預設值,所以放行 ——
       報它的話,那種流程只剩下逐欄位清除可寫,而那種寫法漏一個欄位不會有人發現。 */
    name: 'storeResetDefault 展開後帶回要留的欄位不誤報',
    file: `${T}/.composables/useKeepActions.js`,
    code: `export const useKeepActions = () => {\n  const onReset = () => {\n    const { itemId } = save.value.apiData\n\n    save.value.apiData = { ...store.apiDefault.save, itemId }\n  }\n\n  return { onReset }\n}\n`,
    expect: 0,
    rule: 'storeResetDefault',
  },

  // ---------- 規則 storeActionReturn ----------
  {
    name: 'storeActionReturn 打了 api 卻沒有回傳',
    file: `${T}/.composables/useProjectActions.js`,
    code: `export const useProjectActions = () => {\n  const onApiCityAllGet = async () => {\n    const { data } = await apiCityAllGet({})\n\n    city.value = data\n  }\n\n  return { onApiCityAllGet }\n}\n`,
    expect: 1,
    keyword: '沒有回傳',
  },
  {
    name: 'storeActionReturn 回傳缺欄位',
    file: `${T}/.composables/useKnowledgeActions.js`,
    code: `export const useKnowledgeActions = () => {\n  const onApiPetknowledgeListGet = async () => {\n    const { config, status, data } = await apiPetknowledgeListGet({})\n\n    return { status, data }\n  }\n\n  return { onApiPetknowledgeListGet }\n}\n`,
    expect: 1,
    keyword: '缺少 config',
  },
  {
    name: 'storeActionReturn 三件齊全不誤報',
    file: `${T}/.composables/useEventsActions.js`,
    code: `export const useEventsActions = () => {\n  const onApiActivityListGet = async () => {\n    const { config, status, data } = await apiActivityListGet({})\n\n    return { config, status, data }\n  }\n\n  return { onApiActivityListGet }\n}\n`,
    expect: 0,
  },
  {
    // early return 的分支可以只回部分，只要有一個 return 湊齊三件
    name: 'storeActionReturn early return 分支不誤報',
    file: `${T}/.composables/useSelfTestAlphaActions.js`,
    code: `export const useMemberActions = () => {\n  const onApiMemberInfoGet = async () => {\n    if (!id.value) return { status: null }\n\n    const { config, status, data } = await apiMemberInfoGet({})\n\n    return { config, status, data }\n  }\n\n  return { onApiMemberInfoGet }\n}\n`,
    expect: 0,
  },
  {
    name: 'storeActionReturn 沒打 api 的 action 不受限制',
    file: `${T}/.composables/useCommonActions.js`,
    code: `export const useCommonActions = () => {\n  const onReset = () => {\n    list.value = null\n  }\n\n  return { onReset }\n}\n`,
    expect: 0,
  },

  // ---------- 規則 pageActionNaming ----------
  //
  // 同一個 endpoint 有兩個 method（讀一筆、刪一筆）時，去掉 method 之後
  // 兩支包裝函式會同名 —— 那不只是命名不好看，是程式直接壞掉。
  // 下面三則守的就是這條界線。
  {
    /* 讀取那支維持短名，刪除那支保留 method。
       全部都帶的話，最常用的那支名字反而變長。 */
    name: 'pageActionNaming 撞名時讀取維持短名、刪除帶 method',
    file: `${P}/petClash.vue`,
    code:
      `<script setup>\n` +
      `const { onApiGetMemberPetID, onApiDeleteMemberPetID } = useMemberActions()\n\n` +
      `const onMemberPetID = async () => {\n  await onApiGetMemberPetID({})\n}\n\n` +
      `const onDeleteMemberPetID = async () => {\n  await onApiDeleteMemberPetID({})\n}\n` +
      `</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // 刪除那支去掉了 method，會與讀取那支同名
    name: 'pageActionNaming 撞名時刪除那支去掉 method 要報',
    file: `${P}/petClash2.vue`,
    code:
      `<script setup>\n` +
      `const { onApiGetMemberPetID, onApiDeleteMemberPetID } = useMemberActions()\n\n` +
      `const onMemberPetID = async () => {\n  await onApiGetMemberPetID({})\n}\n\n` +
      `const onMemberPetDelete = async () => {\n  await onApiDeleteMemberPetID({})\n}\n` +
      `</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'onDeleteMemberPetID',
  },
  {
    /* 整組都沒有讀取時（新增與刪除撞在一起），每一支都帶 method ——
       沒有哪一支是預設操作。 */
    name: 'pageActionNaming 撞名組裡沒有讀取時每支都帶 method',
    file: `${P}/petClash3.vue`,
    code:
      `<script setup>\n` +
      `const { onApiPostMemberPetID, onApiDeleteMemberPetID } = useMemberActions()\n\n` +
      `const onPostMemberPetID = async () => {\n  await onApiPostMemberPetID({})\n}\n\n` +
      `const onDeleteMemberPetID = async () => {\n  await onApiDeleteMemberPetID({})\n}\n` +
      `</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'pageActionNaming 頁面包裝名稱對不上 action',
    file: `${P}/voucher.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onVoucherDetail = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'onMemberVoucherID',
  },
  {
    // 頁面那層要把 Api 與 method 兩段都拿掉：onApiGetMemberVoucherID → onMemberVoucherID
    name: 'pageActionNaming 正確命名不誤報',
    file: `${P}/voucher2.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onMemberVoucherID = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // method 沒去掉的舊寫法要被抓出來
    name: 'pageActionNaming 沒去掉 method 那一段要被抓',
    file: `${P}/voucher3.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onGetMemberVoucherID = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'onMemberVoucherID',
  },
  {
    /* postForm 這個 method 連後面的 Form 一起去掉：Form 講的是送出格式（表單），
      不是 endpoint 的一部分。留著會讓這一頁的命名與其他 api 對不齊。 */
    name: 'pageActionNaming postForm 的 Form 也要去掉',
    file: `${P}/upload.vue`,
    code: `<script setup>\nconst { onApiPostFormPhotoUpload } = useMemberActions()\n\nconst onPhotoUpload = async () => {\n  await onApiPostFormPhotoUpload({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 同一個判斷，元件擋、頁面只給建議。
      元件可能出現在很多頁、同一頁也可能出現很多次，自己去要資料就是出現幾次打幾次。 */
    rule: 'componentApiImport',
    name: 'componentApiImport 元件直接 import api 要擋',
    file: `${COMPONENTS_DIR}/${PROBE}/Direct.vue`,
    code: `<script setup>\nimport { apiGetMemberInfo } from '${API_ALIAS_IMPORT}'\n\nconst onLoad = () => apiGetMemberInfo()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '元件不能直接 import api',
  },
  {
    // 進入頁面要拿的資料一支一支等的話，使用者等的是每一支的時間加總
    name: 'pageAwaitAll onMounted 的請求沒有一起發出',
    file: `${P}/await1.vue`,
    code: `<script setup>\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nonMounted(async () => {\n  await onApiGetSelfTestAlpha()\n})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    /* 包裝函式叫什麼從設定取 —— 專案沒有那支共用函式時這條會整條略過,
       名字不一樣的專案也比對不到,兩種情況都與規則本身無關。 */
    expect: 1,
    keyword: PARALLEL_AWAIT_HELPER.name,
  },
  {
    name: 'pageAwaitAll 已經包好的不誤報',
    file: `${P}/await2.vue`,
    code: `<script setup>\nimport { awaitAllPromise } from '@js/_prototype.js'\n\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nonMounted(async () => {\n  await awaitAllPromise([onApiGetSelfTestAlpha()])\n})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 這條只管「進入頁面就要拿的資料」。使用者觸發的動作是單一動作，
      包成陣列反而多一層，不該被抓。 */
    /* 沒有 await 的呼叫不是在等請求 —— 有些函式的名字是 api 那一套命名
       (處理 api 錯誤、重播上一次的結果),但它做的事是同步的。
       包進陣列不會讓任何東西變快,而且存檔時的自動包裝也不會動它:
       報了卻沒有動靜,訊息還說「會自動包好」。 */
    name: 'pageAwaitAll 沒有 await 的呼叫不算請求',
    file: `${P}/probeAwaitSync.vue`,
    code: `<script setup>\nonMounted(() => {\n  onApiErrorReplay()\n})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
    rule: 'pageAwaitAll',
  },
  {
    /* 後面那支用到前面出現過的東西時不能一起發出(同時開始,誰先回來不一定)——
       自動包裝也是這樣判的,所以規則也不報:報了的話訊息說「存檔時會自動包好」,
       而存檔之後什麼都沒發生。 */
    name: 'pageAwaitAll 那幾支不能一起發出時不報',
    file: `${P}/probeAwaitDepend.vue`,
    code:
      `<script setup>\nonMounted(async () => {\n` +
      `  await onApiGetProbeOne(probeId)\n` +
      `  await onApiGetProbeTwo(probeId)\n` +
      `})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
    rule: 'pageAwaitAll',
  },
  {
    name: 'pageAwaitAll 事件處理函式不受限制',
    file: `${P}/await3.vue`,
    code: `<script setup>\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nconst onSelfTestAlpha = async () => {\n  await onApiGetSelfTestAlpha()\n}\n</script>\n\n<template>\n  <div class="m-probe" @click="onSelfTestAlpha"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 用 alias 寫路徑,才只命中這一條 —— 相對路徑會同時觸發「離開自己資料夾要用 alias」,
      那樣就分不出抓到的是哪一條規則。alias 與 api 目錄位置都從專案設定算出來。 */
    name: 'pageApiImport 頁面直接 import api 要擋',
    file: `${P}/direct.vue`,
    code: `<script setup>\nimport { apiGetMemberInfo } from '${apiAliasImportOf('member.js') ?? apiImportPathOf(P, 'member.js')}'\n\nconst onLoad = () => apiGetMemberInfo()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '頁面直接 import 了 api',
  },
  {
    /* 一次性的請求(送出後就不再用)直接打是合理的,標了豁免就跳過整支。
       「真的是一次性」與「偷懶沒寫 actions」寫出來一模一樣,所以由人標、理由留在程式碼裡。 */
    name: 'pageApiImport 標了豁免就放行',
    file: `${P}/directExempt.vue`,
    code: `<script setup>\n/* lint-page-api-exempt: 送出問卷,結果不顯示在畫面上 */\nimport { apiGetMemberInfo } from '${apiAliasImportOf('member.js') ?? apiImportPathOf(P, 'member.js')}'\n\nconst onLoad = () => apiGetMemberInfo()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 元件沒有豁免 —— 它自己去要資料在任何情況下都會「出現幾次打幾次」,
       標了記號也一樣擋。豁免只放行頁面那一種。 */
    rule: 'componentApiImport',
    name: 'componentApiImport 元件標了豁免照樣擋',
    file: `${C}/DirectExempt.vue`,
    code: `<script setup>\n/* lint-page-api-exempt: 標了也沒用 */\nimport { apiGetMemberInfo } from '${apiAliasImportOf('member.js') ?? apiImportPathOf(C, 'member.js')}'\n\nconst onLoad = () => apiGetMemberInfo()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '元件不能直接 import api',
  },
  {
    // onApiPromise / onApiError 是通用工具，不對應任何一支 api
    /* 函式在協調好幾件事時,名字講的是那件事(使用者按了確認、進入畫面要準備什麼),
       那支 api 只是其中一步。改成 api 的名字反而更難懂 ——
       讀的人會以為它只是那支 api 的包裝。 */
    name: 'pageActionNaming 等了第二件事就不是單純包裝',
    file: `${P}/probeFlow.vue`,
    code:
      `<script setup>\nconst onSure = async () => {\n` +
      `  const { valid } = await formRef.value.validate()\n` +
      `  if (!valid) return\n\n` +
      `  await onApiPostProbeThing()\n` +
      `}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
    rule: 'pageActionNaming',
  },
  {
    /* 有條件才打的那一步(「已經有資料就不重打」)不是這個函式的全部 */
    name: 'pageActionNaming 被條件包住的那一步不是單純包裝',
    file: `${P}/probeGuard.vue`,
    code:
      `<script setup>\nconst onInit = async () => {\n` +
      `  if (!probeData.value) {\n    await onApiGetProbeThing()\n  }\n` +
      `}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
    rule: 'pageActionNaming',
  },
  {
    /* 前後開關讀取狀態仍然是單純包裝 —— 這條規範本來就預期那種形狀,
       放過它的話,真正該對齊名字的那一批會整片消失。 */
    name: 'pageActionNaming 只開關讀取狀態仍要對齊名字',
    file: `${P}/probeLoading.vue`,
    code:
      `<script setup>\nconst onSortChange = async () => {\n` +
      `  onApiPromise('open')\n` +
      `  await onApiGetProbeThing()\n` +
      `  onApiPromise('close')\n` +
      `}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    rule: 'pageActionNaming',
    keyword: 'onProbeThing',
  },
  {
    name: 'pageActionNaming 通用工具不受限制',
    file: `${P}/submit.vue`,
    code: `<script setup>\nconst { onApiPromise, onApiError } = useProjectActions()\n\nconst onSubmit = async () => {\n  onApiPromise('open')\n  onApiError({}, 500, {})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 pageApiData ----------
  {
    name: 'pageApiData 頁面自建 apiData',
    file: `${P}/detail.vue`,
    code: `<script setup>\nconst apiData = ref(null)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '頁面自建了 apiData',
  },
  {
    name: 'pageApiData 從 store 取用不誤報',
    file: `${P}/list.vue`,
    code: `<script setup>\nconst exchange = useExchangeStore()\nconst { detail } = storeToRefs(exchange)\nconst apiData = computed(() => detail.value.apiData)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'pageApiData 一般畫面狀態不誤報',
    file: `${P}/panel.vue`,
    code: `<script setup>\nconst isOpen = ref(false)\nconst keyword = ref('')\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 storeToRefs ----------
  {
    name: 'storeToRefs 直接解構 store',
    file: `${P}/direct2.vue`,
    code: `<script setup>\nconst { info } = useMemberStore()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '直接解構',
  },
  {
    name: 'storeToRefs 把 store 屬性讀成 const',
    file: `${P}/direct3.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst info = member.info\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '斷了',
  },
  {
    /* readonly({ … }) 包住的固定設定沒有響應性 —— 沒有人會改它,
       所以「取出來就跟 store 斷了」的前提不成立。而且照這條改會壞掉:
       storeToRefs 只收 ref 與 reactive,拿到的是 undefined,下一行取值就丟錯。 */
    rule: 'storeToRefs',
    name: 'storeToRefs 唯讀常數不誤報',
    file: `${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_DEPS_PAGE)}Actions.js`,
    code: `export default () => {\n  const probe = use${pascalOf(PROBE_DEPS_PAGE)}Store()\n  const btns = probe.buttons\n\n  return { btns }\n}\n`,
    context: {
      [`${T}/${PROBE_DEPS_PAGE}.js`]: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_DEPS_PAGE)}Store = defineStore('${PROBE_DEPS_PAGE}', () => {\n  const buttons = readonly({ sure: [] })\n  const detail = ref(null)\n\n  return { buttons, detail }\n})\n`,
    },
    expect: 0,
  },
  {
    /* 同一支 store 裡真的會變的那一個照樣要報 —— 這條放行的只有唯讀常數。 */
    rule: 'storeToRefs',
    name: 'storeToRefs 唯讀常數之外照樣報',
    file: `${T}/${ACTIONS_DIR_NAME}/use${pascalOf(PROBE_DEPS_PAGE)}Actions.js`,
    code: `export default () => {\n  const probe = use${pascalOf(PROBE_DEPS_PAGE)}Store()\n  const info = probe.detail\n\n  return { info }\n}\n`,
    context: {
      [`${T}/${PROBE_DEPS_PAGE}.js`]: `import { defineStore } from 'pinia'\n\nexport const use${pascalOf(PROBE_DEPS_PAGE)}Store = defineStore('${PROBE_DEPS_PAGE}', () => {\n  const buttons = readonly({ sure: [] })\n  const detail = ref(null)\n\n  return { buttons, detail }\n})\n`,
    },
    expect: 1,
    keyword: 'storeToRefs',
  },
  {
    name: 'storeToRefs 正確寫法不誤報',
    file: `${P}/direct4.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst { info } = storeToRefs(member)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // $ 開頭是 pinia 自己的 API，不是取值
    name: 'storeToRefs pinia API 不誤報',
    file: `${P}/direct5.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst reset = member.$reset\nmember.$patch({ info: null })\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // use*Actions 是一般 composable，不是 store，直接解構才是對的
    name: 'storeToRefs actions 直接解構不誤報',
    file: `${P}/direct6.vue`,
    code: `<script setup>\nconst { onApiGetMemberInfo } = useMemberActions()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

]

/**
 * 這個專案自己的規則,連同它的驗證案例。
 *
 * 規則與案例放在同一支檔案(`.tools/lint/rules-project.mjs` 的 `PROJECT_CASES`)——
 * 分成兩支的話,改了規則忘了改案例不會有人發現,而那正是「規則靜靜失效」的來源。
 *
 * 沒有那支檔案就是空的,一切照舊。
 */
const projectRulesFile = path.join(root, '.tools', 'lint', 'rules-project.mjs')

const projectRules = fs.existsSync(projectRulesFile)
  ? await import(pathToFileURL(projectRulesFile))
  : {}

const PROJECT_CASES = projectRules.PROJECT_CASES ?? []

/** 整份案例 —— 三份合起來就是這支腳本實際要跑的 */
const CASES = [...CSS_CASES, ...RULE_CASES, ...PROJECT_CASES]

/**
 * 色票排序的行為驗證(不需要探測檔)。
 *
 * CRLF 那則是回歸測試:buildColorCss 一律吐 \n,比對前沒有正規化換行的話,
 * CRLF 檔案排序完仍會被判定為「未排序」,每次存檔都重報一次。
 */
const SORT_CASES = [
  {
    name: '排序:亂序會被判定為未排序',
    code: ':root {\n  --gray-333: #333;\n  --red-e01a: #e2001a;\n}\n',
    sorted: false,
  },
  {
    name: '排序:彩虹順序 + 由淺到深視為已排序',
    code: ':root {\n  /* red */\n  --red-e01a: #e2001a;\n\n  /* gray */\n  --gray-333: #333;\n}\n',
    sorted: true,
  },
  {
    name: '排序:CRLF 檔案不會被誤判為未排序',
    code: ':root {\r\n  /* red */\r\n  --red-e01a: #e2001a;\r\n\r\n  /* gray */\r\n  --gray-333: #333;\r\n}\r\n',
    sorted: true,
  },
  {
    name: '排序:-rgb 緊跟在基礎變數之後',
    code: ':root {\n  /* white */\n  --white: #fff;\n  --white-rgb: hexToRgb(#fff);\n}\n',
    sorted: true,
  },
]

/**
 * 色相判斷來源的行為驗證(不需要探測檔)。
 *
 * 兩種來源在同一個專案裡只會用到一種,所以兩種都要在這裡驗 ——
 * 只驗當下設定的那一種的話,另一種要等到換專案才第一次被執行到,
 * 而那時壞掉的徵狀是「色票檔被自動重排成一大群未知色」。
 *
 * 名字那一種要驗的重點是「人的判斷優先」:`#c09648` 在色相環上是橘,
 * 但名字寫 gold 就歸金 —— 金是品牌給的語意分類,色值算不出來。
 */
const HUE_SOURCE_CASES = [
  { name: '色相來源:名字帶色相就照名字', args: ['--red-e01a', '#e2001a', 'name'], hue: 'red' },
  {
    name: '色相來源:名字說是金就歸金(色相環上那是橘)',
    args: ['--gold-c948', '#c09648', 'name'],
    hue: 'gold',
  },
  { name: '色相來源:名字認不出時回 null', args: ['--btn-hover', '#c20016', 'name'], hue: null },
  { name: '色相來源:語意名從色值算得出色相', args: ['--btn-hover', '#c20016', 'value'], hue: 'red' },
  { name: '色相來源:低飽和度歸灰', args: ['--text-sub', '#9e9e9e', 'value'], hue: 'gray' },
  { name: '色相來源:極亮的無彩色歸白', args: ['--bg-main', '#ffffff', 'value'], hue: 'white' },
  { name: '色相來源:極暗的無彩色歸黑', args: ['--text-main', '#000000', 'value'], hue: 'black' },
  { name: '色相來源:從色值算得出藍', args: ['--link', '#0066cc', 'value'], hue: 'blue' },
  { name: '色相來源:取不到色值時回 null', args: ['--x', 'inherit', 'value'], hue: null },
]

/**
 * 命名大宗的判定 —— 設定選的色相來源要與這個結果一致,不一致就在檢查結果旁邊警告。
 *
 * 剛好各半時算 value:那表示已經有一半的變數名看不出顏色,
 * 用 name 會讓那一半每一個都被報「認不出色相前綴」。
 */
/**
 * 頁面資源在第幾層 —— 依專案實際的擺法偵測出來,用來抓 VIEW_RESOURCE_DEPTH 設錯。
 *
 * 這一則驗的是「偵測認不認得出本專案的擺法」。設定與偵測結果不一致時,
 * 前提檢查會講出來 —— 沒有這道驗證的話,偵測壞掉不會有人發現,
 * 而換專案時那一整片「對不上資料夾」就沒有東西指出真正的原因。
 */
const onCheckViewDepth = () => {
  /* 偵測是拿這個專案實際的頁面擺法算的,所以頁面目錄裡要先有頁面。
     一個剛裝上這套工具、還沒有任何頁面的專案,那裡只剩驗證自己建的探測資料夾 ——
     算出來的是探測檔的形狀,與設定對不上是正常的。那時失敗的訊息會看起來像
     偵測壞了,而真正的情況只是還沒有東西可以比對。 */
  const viewsAbs = path.join(root, ...VIEWS_DIR.split('/'))
  const ownPages = fs.existsSync(viewsAbs)
    ? fs
        .readdirSync(viewsAbs, { withFileTypes: true })
        .filter((item) => item.isDirectory() && !isProbeName(item.name))
    : []

  if (!ownPages.length) {
    skipped.push({ name: '頁面資源的層級偵測得出來,而且與設定一致', need: 'ownViewPages' })
    return
  }

  const detected = detectViewResourceDepth(root)

  report(
    detected === VIEW_RESOURCE_DEPTH,
    '頁面資源的層級偵測得出來,而且與設定一致',
    detected === VIEW_RESOURCE_DEPTH
      ? []
      : [`設定是 ${VIEW_RESOURCE_DEPTH},偵測結果是 ${detected}`]
  )
}

/**
 * 專案設定檔只改值、不新增項目 —— 那條規則的判準驗證。
 *
 * 這條只對設定檔那一個路徑生效,所以不能像別條那樣造一支探測檔
 * (造出來就是覆寫真正的設定)。改成直接餵判準函式一段假的設定內容,
 * 三種形狀各驗一次:有人讀的、沒人讀的、只有設定檔自己用的中介值。
 *
 * 最後再對真正的設定檔跑一次,確認這個專案目前沒有多出來的項目。
 */
const onCheckConfigItem = () => {
  const text = [
    'export const USED_BY_RULE = 1',
    'export const NOBODY_READS = 2',
    'export const MIDDLE_VALUE = 3',
    'export const BUILT_FROM_MIDDLE = MIDDLE_VALUE + 1',
  ].join('\n')

  /* MIDDLE_VALUE 沒有被規則讀,只有設定檔自己用它組出 BUILT_FROM_MIDDLE ——
     那種中介值不該被抓,所以 sources 裡只有另外兩項。 */
  const sourceText = ['const x = USED_BY_RULE', 'const y = BUILT_FROM_MIDDLE']
  const found = unusedConfigNames(text, sourceText).map((i) => i.name)
  const expect = ['NOBODY_READS']

  report(
    found.length === expect.length && expect.every((n, i) => found[i] === n),
    'configItem 只抓沒有任何人讀的項目',
    found.length === expect.length && expect.every((n, i) => found[i] === n)
      ? []
      : [`預期 ${JSON.stringify(expect)},實際 ${JSON.stringify(found)}`]
  )

  const configText = fs.readFileSync(path.join(root, ...CONFIG_FILE.split('/')), 'utf8')
  const toolingDir = path.dirname(CONFIG_FILE)
  const configName = path.basename(CONFIG_FILE)
  const sources = fs
    .readdirSync(path.join(root, ...toolingDir.split('/')))
    .filter((name) => name.endsWith('.mjs') && name !== configName)
    .map((name) => fs.readFileSync(path.join(root, ...toolingDir.split('/'), name), 'utf8'))

  const extras = unusedConfigNames(configText, sources).map((i) => i.name)

  report(!extras.length, '本專案的設定檔沒有多出沒人讀的項目', extras.length ? [extras.join('、')] : [])

  /* 同一個違規在兩種身分下的級別相反,而規則跑在哪一種專案上只會走到其中一邊 ——
     不把兩邊都驗過的話,壞掉的那一邊要到換專案時才會發現,而那時的徵狀是
     「設定檔多出的項目沒有被擋」:沒有訊息,看起來與通過一樣。 */
  const asSource = configItemIssueOf(CONFIG_FILE, 1, 'NOBODY_READS', true)
  const asOther = configItemIssueOf(CONFIG_FILE, 1, 'NOBODY_READS', false)

  report(
    asSource.level === 'warn',
    'configItem 在來源專案只提醒',
    asSource.level === 'warn' ? [] : [`預期 warn,實際 ${asSource.level}`]
  )

  report(
    asOther.level === 'error',
    'configItem 在其他專案要擋',
    asOther.level === 'error' ? [] : [`預期 error,實際 ${asOther.level}`]
  )
}

/**
 * 自動產生的清單:探測的那幾行清得掉,專案自己的內容一個字都不能動。
 *
 * 這一道是在收尾時跑的,跑完就沒有痕跡 —— 壞掉的話不會有任何徵兆,
 * 只是那份清單開始累積指向不存在檔案的行,而看到的人不知道那是什麼。
 *
 * 在暫存目錄裡試,不碰這個專案的清單。
 */
const onCheckGeneratedCleanup = () => {
  /* 內容用實際的形狀造:自動注入的清單一行就是一個元件,
     名字出現在行的中間(前面有縮排與識別字)。 */
  const own = `    CommonHeader: typeof import('./components/common/Header.vue')['default']`
  const probeComponent = `    Probe1: typeof import('./components/${PROBE}/Tw1.vue')['default']`
  const probePage = `    Probe2: typeof import('./views/${PROBE_PAGE_PREFIX}Alpha/Index.vue')['default']`

  const cleaned = withoutProbeLines([own, probeComponent, probePage, own].join('\n'))
  const problems = []

  if (cleaned.includes(PROBE) || cleaned.includes(PROBE_PAGE_PREFIX)) {
    problems.push('探測的那幾行沒有被清乾淨')
  }
  if (cleaned !== `${own}\n${own}`) {
    problems.push('專案自己的那幾行被動到了 —— 那份清單裡其他的內容不能碰')
  }

  report(!problems.length, '自動產生的清單只清探測的那幾行', problems)
}

/**
 * 探測目錄只開自己的,已經存在的一律不碰。
 *
 * 驗證會建東西再刪掉。刪的那一步沒辦法分辨「這是我剛建的」與「這本來就在」——
 * 一旦探針的名字撞到專案真實的資料夾,結束時就會把裡面真正的程式碼一起刪掉,
 * 而畫面上照常顯示全部通過。
 *
 * 在暫存目錄裡試,不碰這個專案。
 */
const onCheckProbeDirSafety = () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-probe-dir-'))
  const problems = []

  try {
    const fresh = path.join(base, 'fresh')
    if (makeProbeDir(fresh) !== fresh || !fs.existsSync(fresh)) problems.push('不存在的目錄沒有被建起來')

    const taken = path.join(base, 'taken')
    const real = path.join(taken, 'real.js')

    fs.mkdirSync(taken)
    fs.writeFileSync(real, 'export const real = 1\n', 'utf8')

    if (makeProbeDir(taken) !== null) problems.push('已經有東西的目錄要回 null,那一則才會跳過')
    if (!fs.existsSync(real)) problems.push('已經存在的檔案被動到了')
  } finally {
    fs.rmSync(base, { recursive: true, force: true })
  }

  report(!problems.length, '探測目錄只開自己的,已經存在的一律不碰', problems)
}

/**
 * 每一則案例的檔案都落在探測目錄底下。
 *
 * cleanup 清的是那幾個目錄(PROBE_DIRS)。案例把檔案寫在別的地方時,
 * 跑完一次就留一支在專案裡 —— 那支檔案沒有人認得,而且會被規則掃到,
 * 看起來像專案自己有一筆違規。
 */
const onCheckCaseFilesInProbeDirs = () => {
  /** 這支檔案跑完會不會被清掉 —— 判準與 cleanup 讀的是同一份 */
  const willBeCleaned = (file) => {
    if (PROBE_DIRS.some((dir) => file.startsWith(`${dir}/`))) return true

    return PROBE_SWEEPS.some(({ dir, match }) => {
      if (dir && !file.startsWith(`${dir}/`)) return false

      const [first] = (dir ? file.slice(dir.length + 1) : file).split('/')
      return Boolean(first) && match(first)
    })
  }

  /* 案例自己那一支,加上它為了跨檔情境鋪的那幾支(context)——
     兩種都是寫進專案的檔案,漏掉哪一種都會留東西在專案裡。 */
  const written = CASES.flatMap((c) => [c.file, ...Object.keys(c.context ?? {})])

  const leftover = [...new Set(written.filter(Boolean))].filter((file) => !willBeCleaned(file))

  report(
    !leftover.length,
    '每一則案例寫出去的檔案都清得掉',
    leftover.map((file) => `${file} 跑完會留在專案裡 —— 放進探測目錄,或讓檔名認得出是探測檔`)
  )
}

/**
 * 每一條規則都要被說明文件講到。
 *
 * 規則寫在程式裡,而看的人是從說明文件知道「這套工具在管什麼」的。
 * 新增一條規則卻忘了寫進去,那條規則照樣在擋,但**沒有人找得到它在管什麼、
 * 為什麼**——照文件找的人會以為沒有這一條,被擋下來時只看得到一個陌生的代號。
 *
 * 各類寫法的規範(skills)裡有提不算數:那幾份講的是「這一類程式怎麼寫」,
 * 一條規則可能橫跨好幾類,也可能哪一類都不屬於(文字怎麼寫的那幾條)。
 * 說明文件那一層才是「有哪些規則」的完整清單。
 */
const onCheckRulesDocumented = () => {
  const dir = path.join(root, ...CONVENTION_DOCS_DIR.split('/'))

  if (!fs.existsSync(dir)) {
    skipped.push({ name: '每一條規則都有寫進說明文件', need: 'conventionDocs' })
    return
  }

  const text = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n')

  /* 專案自己的規則不列入 —— 這一層的文件分兩種,兩種它都放不進去:
     來源那幾支整套複製時會被覆蓋,專案自己那幾支記的是待辦與數字,不是規則說明。
     它們的說明就寫在 rules-project.mjs 的規則旁邊。 */
  const missing = Object.keys(RULE_TITLE)
    .filter(isSharedRule)
    .filter((rule) => !new RegExp(`\`${rule}\``).test(text))

  report(
    !missing.length,
    '每一條規則都有寫進說明文件',
    missing.length ? [`說明文件裡找不到:${missing.join('、')}`] : []
  )
}

/**
 * 每一條規則都要被寫法規範講到。
 *
 * 說明文件那一層(前一則在比對的)是「有哪些規則」的總表,給的是概觀;
 * **寫法規範才是動手之前會讀的那一份** —— 要寫什麼、為什麼、不這樣做會怎樣。
 *
 * 規則只存在於程式裡的話,照著規範做的人不可能事先知道有這回事:
 * 寫完被擋下來,看到的是一個陌生的代號,而他讀過的那幾份規範一個字都沒提。
 * 那種規則的存量會一直長大 —— 不是有人不守,是沒有人知道。
 *
 * 工具自己的狀態回報(某條規則執行失敗)不在此列,那種沒有寫法可以遵守,
 * 由 TOOL_STATE_RULES 明確列出。
 */
const onCheckRulesInConventions = () => {
  const dirs = [CONVENTION_SKILLS_DIR, CONVENTION_RULES_DIR]
    .map((dir) => path.join(root, ...dir.split('/')))
    .filter((dir) => fs.existsSync(dir))

  if (!dirs.length) {
    skipped.push({ name: '每一條規則都有寫進寫法規範', need: 'conventionDocs' })
    return
  }

  const readAll = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
      const full = path.join(dir, item.name)
      if (item.isDirectory()) return readAll(full)

      return item.name.endsWith('.md') ? [fs.readFileSync(full, 'utf8')] : []
    })

  const text = dirs.flatMap(readAll).join('\n')
  const state = new Set(TOOL_STATE_RULES)

  const missing = Object.keys(RULE_TITLE).filter(
    (rule) => !state.has(rule) && isSharedRule(rule) && !text.includes(rule)
  )

  report(
    !missing.length,
    '每一條規則都有寫進寫法規範',
    missing.length
      ? [
          `寫法規範裡找不到:${missing.join('、')} —— ` +
            `照著規範做的人不會知道有這條,被擋下來時只看得到一個陌生的代號`,
        ]
      : []
  )
}

/**
 * 每一條規則都要講清楚「它依不依賴前提」。
 *
 * 前提檢查的每一項寫著「缺了什麼、哪幾條會因此不作用」,而那份清單是手寫的 ——
 * **漏列一條不會有任何徵兆**:那條規則照樣因為缺前提而掃不到東西,
 * 但「哪幾條沒有作用」的訊息不會提到它,看的人以為它通過了。
 *
 * 所以每一條規則都要有歸屬:被某一項前提涵蓋,或列在「不依賴前提」那份清單裡。
 * 兩邊都沒有就是漏了;兩邊都有則是兩種說法打架,照樣要報。
 */
const onCheckPreflightCoverage = () => {
  const rules = Object.keys(RULE_TITLE)
  const covered = new Set(PREFLIGHT_RULES)
  const free = new Set(NO_PREREQUISITE_RULES)

  /* 專案自己的規則不列入 —— 那幾條由專案自己維護,來源的前提清單不會知道它們 */
  const shared = rules.filter(isSharedRule)

  const orphan = shared.filter((rule) => !covered.has(rule) && !free.has(rule))
  const both = shared.filter((rule) => covered.has(rule) && free.has(rule))

  const problems = []
  if (orphan.length) {
    problems.push(
      `沒有說它依不依賴前提:${orphan.join('、')} —— ` +
        `依賴某個目錄或設定就加進那一項的 rules,否則列進 NO_PREREQUISITE_RULES`
    )
  }
  if (both.length) problems.push(`兩種說法都寫了:${both.join('、')}`)

  report(!problems.length, '每一條規則都講清楚了依不依賴前提', problems)
}

/**
 * 每一條建議級的規則,都要有一則案例驗到「它是建議,不是要擋的」。
 *
 * 建議級不列入阻擋計數,所以級別寫錯了不會有任何徵兆:該擋的那條變成只是提醒,
 * 而案例的 expect 照樣對得上、清單上看起來仍然通過。要到某天有人問
 * 「這個為什麼沒擋住」才會發現。
 *
 * 「哪幾條是建議級」直接讀規則的原始碼(呼叫 warnOf 的那幾處)——
 * 另外維護一份清單的話,新增一條建議級規則時那份清單不會跟著長,
 * 而漏掉的那條正是這裡要抓的。
 */
const WARN_RULE_RE = /warnOf\(\s*[\s\S]{0,160}?'([\w:]+)'/g

/** 不是用 CASES 驗的建議級規則 —— 各自有獨立的驗證,列在這裡才看得出不是漏掉 */
const WARN_VERIFIED_ELSEWHERE = {
  configItem: '兩種身分的級別相反,由 onCheckConfigItem 各驗一次',
}

const onCheckWarnRulesVerified = () => {
  const here = fileURLToPath(import.meta.url)
  const dir = path.dirname(here)

  const text = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.mjs') && name !== path.basename(here))
    .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n')

  /* 只留真的是規則代號的 —— warnOf 的參數裡若有別的字串,抓出來的會是雜訊,
     而雜訊會讓這一條變成「每次都報一個不存在的規則」,最後被當成壞掉的檢查。 */
  const warnRules = [...new Set([...text.matchAll(WARN_RULE_RE)].map((m) => m[1]))].filter(
    (rule) => RULE_TITLE[rule]
  )

  const verified = new Set(CASES.filter((c) => c.expectWarn > 0).map((c) => c.rule))
  const missing = warnRules.filter((rule) => !verified.has(rule) && !WARN_VERIFIED_ELSEWHERE[rule])

  report(
    !missing.length,
    '每一條建議級的規則都有案例驗到它是建議',
    missing.length
      ? [
          `沒有驗到建議級:${missing.join('、')} —— ` +
            '案例加上 expectWarn,或在 WARN_VERIFIED_ELSEWHERE 寫清楚它在哪裡驗',
        ]
      : []
  )
}

/**
 * 這支檔案裡定義的每一個檢查,都要真的被執行到。
 *
 * 檢查是寫成一支一支的函式,再列在執行的地方逐一呼叫。**寫了函式卻忘了列上去
 * 是不會有任何徵兆的**:總數不會變少(它本來就沒被算過)、不會報錯、
 * 也不會有紅字 —— 看起來與「這個檢查通過了」一模一樣,而它從來沒有跑過。
 *
 * 所以拿這支檔案自己的內容比對:定義了哪幾個、執行的地方呼叫了哪幾個。
 * 少了誰就報出來,名字也一併印出來,不必自己去翻。
 */
const onCheckEveryCheckRuns = () => {
  const text = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')

  const defined = [...text.matchAll(/^const (onCheck\w+) = /gm)].map((m) => m[1])
  const called = new Set([...text.matchAll(/\b(onCheck\w+)\(\)/g)].map((m) => m[1]))
  const missing = defined.filter((name) => !called.has(name))

  report(
    !missing.length,
    '這支檔案定義的每一個檢查都有被執行到',
    missing.length ? [`定義了卻沒有被呼叫:${missing.join('、')}`] : []
  )
}

/**
 * 「在不在列出的那幾層底下」的判準 —— 排除清單靠它決定哪些檔案不檢查。
 *
 * 直接餵判準函式假的清單,不靠專案自己的設定:多數專案那份清單是空的,
 * 靠設定來驗的話,那種專案等於完全沒有驗到 —— 而清單空的時候正是
 * 「一筆都不該排除」這個最重要的行為。
 */
/**
 * store 裡可以呼叫什麼 —— 含「讀設定」那一類。
 *
 * 直接餵判準函式假的清單,不靠專案自己的設定:多數專案那份清單是空的,
 * 靠設定來驗的話,「清單裡的那幾支會被放行」這件事永遠沒有人守,
 * 而那正是這次新增的部分。
 */
const onCheckStoreDeclareCall = () => {
  const setup = ['useProbeRuntimeConfig']

  const cases = [
    { name: 'ref', allow: true, why: '狀態的初始化' },
    { name: 'computed', allow: true, why: '衍生狀態' },
    { name: 'useMemberStore', allow: true, why: '取用另一個 store' },
    { name: 'storeToRefs', allow: true, why: '取用另一個 store 的值' },
    { name: 'useProbeRuntimeConfig', allow: true, why: '讀設定(清單裡的那一支)' },
    { name: 'useProbeActions', allow: false, why: '行為 —— 不在清單裡就照樣報' },
    { name: 'onApiGetProbe', allow: false, why: '打 api' },
  ]

  const wrong = cases.filter((c) => isStoreDeclareCall(c.name, setup) !== c.allow)

  report(
    !wrong.length,
    'store 裡可以呼叫的東西:讀設定那一類放行,行為照樣報',
    wrong.map((c) => `${c.why} —— ${c.name}() 預期${c.allow ? '放行' : '報出來'}`)
  )
}

/**
 * 共用變數檔裡哪幾組其實只有一個模組在用。
 *
 * 直接餵判準函式假的資料,不靠專案自己的共用變數檔:多數專案那一份是空的
 * (樣式都跟著元件走),靠實際檔案來驗的話,這條的判準永遠沒有人守。
 */
const onCheckSingleModuleVars = () => {
  const defined = new Set(['--probe-shared-px', '--probe-only-one', '--probe-nobody'])

  const usedBy = new Map([
    ['--probe-shared-px', new Set(['mProbeForm', 'mProbeDatepicker'])],
    ['--probe-only-one', new Set(['mProbeForm'])],
  ])

  const got = singleModuleVarsOf(defined, usedBy)
  const problems = []

  if (got.length !== 1) {
    problems.push(`預期只報一組,實際 ${got.length} 組:${got.map(([n]) => n).join('、')}`)
  } else {
    const [[name, owner]] = got
    if (name !== '--probe-only-one') problems.push(`報錯了對象:${name}`)
    if (owner !== 'mProbeForm') problems.push(`指錯了模組:${owner}`)
  }

  report(
    !problems.length,
    '共用變數檔:兩個模組在用的放行、只有一個的要報、沒有人用的不算',
    problems
  )
}

/**
 * 規格文件裡的欄位名要從兩種位置收:properties 與 parameters。
 *
 * 直接餵判準函式一份最小的規格,不靠專案自己那一份:每個專案的 api 不一樣,
 * 靠實際文件來驗的話,「網址上的參數也算數」這件事在沒有那種 api 的專案
 * 永遠沒有人守 —— 而漏收它的後果是那些參數被要求加底線,加了就送不出去。
 */
const onCheckApiFieldSources = () => {
  const names = apiFieldNamesOf({
    paths: {
      '/probe/{probePathParam}': {
        get: {
          parameters: [{ name: 'probePathParam' }, { name: 'probeQueryParam' }],
          responses: { 200: { schema: { properties: { probeBodyField: {} } } } },
        },
      },
    },
  })

  const missing = ['probePathParam', 'probeQueryParam', 'probeBodyField'].filter(
    (name) => !names.has(name)
  )

  report(
    !missing.length,
    '規格文件的欄位名:properties 與 parameters 兩種都要收',
    missing.map((name) => `${name} 沒有被收進索引 —— 它會被當成前端自己掛的欄位`)
  )
}

/**
 * 被中斷時也要清掉探測檔。
 *
 * 這件事沒辦法在同一個程序裡真的驗(要送訊號給自己、還要等它處理完),
 * 所以驗的是「有沒有掛上去」—— 拿這支檔案自己的內容比對。
 *
 * 值得為它寫一則的理由:那幾支探測檔看起來像真的元件、色票與頁面,
 * 殘留之後下一次檢查會把它們當成專案內容,而這套工具還會被整批複製到
 * 別的專案 —— 跟著過去之後,那邊沒有人知道它們是什麼、也不敢刪。
 */
const onCheckCleanupOnSignal = () => {
  const text = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
  const missing = ['SIGINT', 'SIGTERM'].filter(
    (signal) => !new RegExp(`process\\.once\\([^)]*|['"]${signal}['"]`).test(text)
  )

  const wired = /for \(const signal of \[[^\]]*\]\) \{\s*process\.once\(signal, \(\) => \{\s*cleanup\(\)/.test(
    text
  )

  report(
    wired && !missing.length,
    '被中斷時也會清掉探測檔',
    wired ? [] : ['cleanup 沒有掛在中斷訊號上 —— 中途停掉的話,那一批探測檔會留在專案裡']
  )
}

const onCheckUnderAny = () => {
  const cases = [
    { rel: 'components/vendor/Chart.vue', dirs: ['components/vendor'], hit: true, why: '在排除的那一層底下' },
    { rel: 'components/vendor', dirs: ['components/vendor'], hit: true, why: '目錄本身' },
    {
      rel: 'pages/buy/vendor/Index.vue',
      dirs: ['components/vendor'],
      hit: false,
      why: '別處的同名資料夾照常檢查(比對的是路徑,不是名字)',
    },
    { rel: 'components/vendorList/Index.vue', dirs: ['components/vendor'], hit: false, why: '名字只是開頭相同' },
    { rel: 'components/vendor/Chart.vue', dirs: [], hit: false, why: '清單是空的就一筆都不排除' },
  ]

  const wrong = cases.filter((c) => isUnderAny(c.rel, c.dirs) !== c.hit)

  report(
    !wrong.length,
    '排除清單:比對的是路徑,而且清單空的時候一筆都不排除',
    wrong.map((c) => `${c.why} —— ${c.rel} 預期${c.hit ? '排除' : '不排除'}`)
  )

  /* 來源的判定 —— 設定裡的來源名稱與這個專案自己的名稱對得上就是來源。
     兩邊都從設定取,不寫死任何一個名字:寫死的話,換一個專案這則不是永遠通過
     就是永遠失敗,而它要驗的「兩者比對得起來」根本沒被驗到。 */
  const nameMatches = PROJECT_NAMES.some((name) =>
    new RegExp(name.trim().split(/\s+/).join('[\\s_-]?'), 'i').test(SOURCE_PROJECT_NAME)
  )

  report(
    IS_SOURCE_PROJECT === nameMatches,
    '來源的判定與「專案名稱對不對得上」一致',
    IS_SOURCE_PROJECT === nameMatches
      ? []
      : [`名稱比對是 ${nameMatches},規則判定是 ${IS_SOURCE_PROJECT}`]
  )
}

const MAJORITY_CASES = [
  { name: '命名大宗:全部帶色相時是 name', style: { hued: 10, semantic: 0 }, majority: 'name' },
  { name: '命名大宗:全部語意名時是 value', style: { hued: 0, semantic: 10 }, majority: 'value' },
  { name: '命名大宗:帶色相過半時是 name', style: { hued: 6, semantic: 4 }, majority: 'name' },
  { name: '命名大宗:剛好各半時算 value', style: { hued: 5, semantic: 5 }, majority: 'value' },
  { name: '命名大宗:一個變數都沒有時無從判斷', style: { hued: 0, semantic: 0 }, majority: null },
]

/**
 * 已廢除的透明度寫法 —— 存檔時自動轉成 8 碼的行為驗證。
 *
 * 這個函式會直接改檔,而且色票改名時還會掃過全站換掉使用端,
 * 所以「不該動的一定不能動」比「該轉的有轉」更要緊:
 * `hexToRgb()` 走的是另一條路(先問人),誤轉的話會建出沒人要的變數。
 *
 * expect 是轉換後那一行的樣子;null 代表完全不動。
 */
const LEGACY_RGBA_CASES = [
  {
    name: 'rgba:色票值寫成 rgba(#hex, a) 時連名字一起轉',
    rel: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* black */\n  --black-rgb: rgba(#000, 0.3);\n}\n`,
    expect: '--black-4d: #0000004d;',
    renamed: ['--black-rgb -> --black-4d'],
  },
  {
    name: 'rgba:色票值引用別的變數時查得到基礎色',
    rel: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code:
      `:root {\n` +
      `  /* gray */\n` +
      `  ${PROBE_COLOR_VAR}: ${PROBE_COLOR_HEX};\n` +
      `  ${PROBE_COLOR_VAR}-30: rgba(var(${PROBE_COLOR_VAR}), ${PROBE_REF_ALPHA});\n` +
      `}\n`,
    expect: `${PROBE_REF_VAR}: ${PROBE_REF_HEX};`,
    renamed: [`${PROBE_COLOR_VAR}-30 -> ${PROBE_REF_VAR}`],
  },
  {
    /* hexToRgb 要先知道那個衍生變數被用在哪幾種透明度,才知道要建幾個變數。
       那是判斷題,所以這裡完全不碰,由規則報出來讓人決定。 */
    name: 'rgba:色票裡的 hexToRgb 完全不動',
    rel: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* black */\n  --black-rgb: hexToRgb(#000);\n}\n`,
    expect: null,
  },
  {
    name: 'rgba:已經是 8 碼的色票不動',
    rel: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* black */\n  --black-4d: #0000004d;\n}\n`,
    expect: null,
  },
  {
    name: 'rgba:使用端的 rgba(#hex, a) 併成 8 碼色碼',
    rel: `${CSS_MODULES_DIR}/mProbe/common.css`,
    code: `.m-probe {\n  color: rgba(#7d582b, 0.5);\n}\n`,
    expect: 'color: #7d582b80;',
  },
  {
    name: 'rgba:沒有舊寫法時完全不動',
    rel: `${CSS_MODULES_DIR}/mProbe/common.css`,
    code: `.m-probe {\n  color: var(--black);\n}\n`,
    expect: null,
  },
]

/**
 * onRemoveEmptyRules 的行為驗證(不需要探測檔)。
 *
 * 這個函式會自動刪掉「空的規則區塊」,判斷錯了就是直接刪掉程式碼,
 * 所以除了「該刪的有刪」之外,更要驗「不該刪的一定不能碰」:
 * `default: () => ({}),` 與 `if (…) return {}` 長得像空區塊,但都是正常的程式碼。
 */
const EMPTY_RULE_CASES = [
  { name: '空區塊會被移除', rel: 'a.css', code: `.m-a {\n  color: red;\n}\n\n.m-b {}\n`, changed: true },
  { name: '帶註解的區塊不算空', rel: 'a.css', code: `.m-b {\n  /* 之後補 */\n}\n`, changed: false },
  { name: '沒有空區塊時不動檔案', rel: 'a.css', code: `.m-a {\n  color: red;\n}\n`, changed: false },
  {
    name: 'default: () => ({}) 不可被當成空區塊',
    rel: 'a.css',
    code: `const props = defineProps({\n  config: {\n    type: Object,\n    default: () => ({}),\n  },\n})\n`,
    changed: false,
  },
  {
    // 這種寫法只會出現在 .vue 的 <script>,由「只掃 <style>」那道防線擋下;
    // 純 CSS 的 `: {}` 不是合法規則,刪掉無害(見下一則 :hover 的案例)
    name: '.vue script 內三元運算子的 : {} 不可被刪',
    rel: 'a.vue',
    code: `<script setup>\nconst a = cond\n  ? {\n      b: 1,\n    }\n  : {}\n</script>\n`,
    changed: false,
  },
  {
    name: '空的偽類規則照樣移除',
    rel: 'a.css',
    code: `.m-a {\n  color: red;\n}\n\n.m-a:hover {}\n`,
    changed: true,
  },
  {
    name: '.vue 的 <script> 不受影響,<style> 照常清理',
    rel: 'a.vue',
    code: `<script setup>\nconst props = defineProps({\n  config: {\n    default: () => ({}),\n  },\n})\n</script>\n\n<style>\n.m-a {}\n</style>\n`,
    changed: true,
    expectKeep: 'default: () => ({}),',
    expectDrop: '.m-a {}',
  },
  {
    /* 掃描範圍擴到 .js 之後,這行完全符合空區塊的形狀,
      而 `[^{}]*` 會跨行 —— 前面那兩行程式碼會一起被吃掉。 */
    name: '.js 一律不處理(if (...) return {} 不可被刪)',
    rel: 'a.js',
    code: `const events = toValue(source)\n\n// 沒指定就整組不傳\nif (!Array.isArray(events)) return {}\n`,
    changed: false,
    expectKeep: 'const events = toValue(source)',
  },
  {
    name: '.mjs / .cjs 同樣一律不處理',
    rel: 'a.mjs',
    code: `const onNoop = () => {}\n`,
    changed: false,
    expectKeep: 'const onNoop = () => {}',
  },
]

/**
 * 「把進入頁面要拿的資料包成一起發出」的自動修正驗證。
 *
 * 這個功能會直接改動程式碼,所以「不該改的絕對不能改」比「該改的有改」更重要:
 * 後面那支用到前面的結果時一起發出,它會拿到還沒準備好的值,而且不會報錯。
 *
 *   code     改寫前的內容
 *   expect   改寫後必須出現的片段;null 代表「應該完全不動」
 */
const WRAP_MOUNTED_CASES = [
  {
    name: '單支請求會被包起來,import 也補上',
    code: `<script setup>\nimport { computed } from 'vue'\n\nonMounted(async () => {\n  await onApiGetAlpha()\n})\n</script>\n`,
    expect: [
      'await awaitAllPromise([onApiGetAlpha()])',
      "import { awaitAllPromise } from '@js/_prototype.js'",
    ],
  },
  {
    name: '連續多支併成一次發出',
    code: `<script setup>\nimport { computed } from 'vue'\n\nonMounted(async () => {\n  await onApiGetAlpha()\n  await onApiGetBeta()\n})\n</script>\n`,
    expect: ['await awaitAllPromise([onApiGetAlpha(), onApiGetBeta()])'],
  },
  {
    /* 後面那支拿前面的結果當參數 —— 一起發出的話它會拿到還沒準備好的值。
      這種一律不動,交給人決定。 */
    name: '後面用到前面的結果就不合併',
    code: `<script setup>\nonMounted(async () => {\n  await onApiGetAlpha(id)\n  await onApiGetBeta(id)\n})\n</script>\n`,
    expect: null,
  },
  {
    /* 接收回傳值的那一行不碰 —— 包進陣列之後就拿不到結果了。
      它後面那支雖然用到那個結果，但仍然排在它之後執行，單獨包起來不改變順序，
      所以照樣包。 */
    name: '接收回傳值的那一行不碰，後面那支照樣單獨包',
    code: `<script setup>\nonMounted(async () => {\n  const { data } = await onApiGetAlpha()\n  await onApiGetBeta(data)\n})\n</script>\n`,
    expect: [
      'const { data } = await onApiGetAlpha()',
      'await awaitAllPromise([onApiGetBeta(data)])',
    ],
  },
  {
    name: '已經包好的不重複包',
    code: `<script setup>\nimport { awaitAllPromise } from '@js/_prototype.js'\n\nonMounted(async () => {\n  await awaitAllPromise([onApiGetAlpha()])\n})\n</script>\n`,
    expect: null,
  },
  {
    // 這條只管 onMounted，事件處理函式不碰
    name: '事件處理函式不動',
    code: `<script setup>\nconst onAlpha = async () => {\n  await onApiGetAlpha()\n}\n</script>\n`,
    expect: null,
  },
  {
    /* 中間夾了別的語句代表那幾支之間有順序安排，
      跨過去合併會把「先做這件事再打那支」打散。 */
    name: '中間夾了別的語句就不跨過去合併',
    code: `<script setup>\nonMounted(async () => {\n  await onApiGetAlpha()\n  onSomething()\n  await onApiGetBeta()\n})\n</script>\n`,
    expect: ['await awaitAllPromise([onApiGetAlpha()])', 'await awaitAllPromise([onApiGetBeta()])'],
  },
]

/**
 * 「從 apiDefault 還原時改成深拷貝」的自動修正驗證。
 *
 * apiDefault 是唯讀的而且是深層的:展開一層只複製到最外面那一層,
 * 裡面的陣列仍然是原本那一個唯讀的陣列 —— 還原之後 push 進不去,
 * 長度永遠是 0,而且正式版沒有任何徵兆。
 *
 * 這個功能會直接改動程式碼,所以「補不上 import 就整個不動」也要驗:
 * 換了寫法卻找不到那支函式的話,整支檔案會壞掉,比不修還糟。
 *
 *   code     改寫前的內容
 *   rel      這支檔案的位置;沒填就當成 actions 檔
 *   expect   改寫後必須出現的片段;null 代表「應該完全不動」
 */
const CLONE_DEFAULT_CASES = [
  {
    name: '展開一層會換成深拷貝,import 也補上',
    code: `import { apiGet } from '@js/_api/alpha.js'\n\nexport const useAlphaActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { ...store.apiDefault.detail }\n  }\n}\n`,
    expect: [
      'detail.value.apiData = onDeepClone(store.apiDefault.detail)',
      "import { onDeepClone } from '@js/_prototype.js'",
    ],
  },
  {
    /* 後面那幾個欄位是呼叫端刻意留著的值,不是預設值 —— 只換展開的那一段。 */
    name: '帶回要留著的欄位時只換展開的那一段',
    code: `import { apiGet } from '@js/_api/alpha.js'\n\nexport const useAlphaActions = () => {\n  const onReset = () => {\n    save.value.apiData = { ...store.apiDefault.save, itemId }\n  }\n}\n`,
    expect: ['save.value.apiData = { ...onDeepClone(store.apiDefault.save), itemId }'],
  },
  {
    name: '已經是深拷貝就不動',
    code: `import { onDeepClone } from '@js/_prototype.js'\n\nexport const useAlphaActions = () => {\n  const onReset = () => {\n    detail.value.apiData = onDeepClone(store.apiDefault.detail)\n  }\n}\n`,
    expect: null,
  },
  {
    /* 具名匯入常常一行一個,整段跨好幾行。把「以 import 開頭的那一行」
       當成一整段的話,補上去的那一行會插進這一段的中間 ——
       整支檔案變成語法錯誤,而且是自動修正自己造成的。 */
    name: '多行的 import 不會被插在中間',
    code: `import {\n  apiGetAlpha,\n  apiGetBeta,\n} from '@js/_api/alpha.js'\n\nexport const useAlphaActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { ...store.apiDefault.detail }\n  }\n}\n`,
    expect: [
      "} from '@js/_api/alpha.js'\nimport { onDeepClone } from '@js/_prototype.js'",
      'detail.value.apiData = onDeepClone(store.apiDefault.detail)',
    ],
  },
  {
    /* 同一支來源已經 import 別的東西時加進那一段裡,不要再開一行。 */
    name: '同一支來源已經有多行 import 時加進那一段',
    code: `import {\n  onFormatDate,\n} from '@js/_prototype.js'\n\nexport const useAlphaActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { ...store.apiDefault.detail }\n  }\n}\n`,
    expect: ['{ onDeepClone,'],
  },
  {
    /* 頁面自己的 composable 也會從 apiDefault 取初始值,踩到的是同一件事 ——
       範圍只限 actions 的話,那一層漏掉而且沒有任何徵兆。 */
    name: 'actions 以外的檔案也會修',
    code: `import { useAlphaStore } from '@stores/alpha.js'\n\nexport const useCore = () => {\n  const onAdd = () => {\n    list.value.push({ ...alpha.apiDefault.item })\n  }\n}\n`,
    rel: `${VIEWS_DIR}/selfTestAlpha/.composables/core.js`,
    expect: ['list.value.push(onDeepClone(alpha.apiDefault.item))'],
  },
  {
    /* 一行 import 都沒有時補不上去 —— 那時換掉寫法會讓整支檔案找不到那支函式。 */
    name: '補不上 import 就整個不動',
    code: `export const useAlphaActions = () => {\n  const onReset = () => {\n    detail.value.apiData = { ...store.apiDefault.detail }\n  }\n}\n`,
    expect: null,
  },
]

/**
 * 元件 import 分組順序的自動排序驗證。
 *
 * 這個功能會**直接改動程式碼**,所以除了「排對順序」之外,
 * 更要驗「不該動的絕對不能動」:不是元件的檔案不碰、認不出來的寫法整塊不動。
 *
 *   rel      檔案路徑(只有共用元件目錄底下的 .vue 會被排)
 *   code     排序前的內容
 *   expect   排序後 import 那幾行的順序;null 代表「應該完全不動」
 */
/**
 * 一支色票有好幾組的情況 —— 深淺主題寫成巢狀的兩層就是兩組。
 *
 * 這幾則驗的是「每一組都算數」:只認第一組的話,第二組不會被排序、
 * 不會被檢查,而畫面上顯示的是通過 —— 那種失效沒有任何徵兆。
 *
 * 探針直接餵給解析函式,不寫成檔案案例:這幾件事問的是解析與重建本身,
 * 與「哪一支檔案算色票」無關,寫成檔案還要遷就色票檔的命名才掃得到。
 */
/**
 * 規則自己壞掉時,要講出來而不是安靜跳過。
 *
 * 最常見的成因是搬了函式卻沒搬它的 import —— 那種錯誤在載入時不會報,
 * 要執行到那一行才爆。爆了如果被接住並回傳空陣列,那條規則從此不抓任何東西,
 * 而畫面上顯示的是通過:一顆看不見的未爆彈,通常要幾個月後才被發現。
 *
 * 探針餵一段會讓規則拋錯的輸入:`text` 給 null,任何一條規則一碰它就爆。
 */
/**
 * 這個專案自己的規則,每一條都要有案例。
 *
 * 「每條規則都要有案例」是這套工具最有效的一道 —— 規則改壞了、漏了 import、
 * 判準寫反了,都是靠案例當場失敗才被發現的。專案自己加的規則如果不受這道約束,
 * 它就成了整套裡唯一沒有人驗的部分,而那種規則壞掉時畫面上顯示的是通過。
 *
 * 沒有專案規則檔時這一則什麼都不做。
 */
/**
 * api 目錄再分一層時,資源是哪一個名字。
 *
 * 有的專案的 api 依「服務」分層,每一層有自己的連線設定(.config.js)——
 * 那一層才是資源,底下的檔案是它的功能分檔。沒有 .config.js 的資料夾只是分類,
 * 資源仍然是檔名。
 *
 * 分不出這兩種的話,分層專案的每一支 api 都會被報「對不上資料夾」,
 * 而它們其實都對得上 —— 一整批誤報會讓人乾脆忽略整條規則。
 *
 * 這一則實際建出兩種形狀再刪掉,不用寫死任何專案的目錄名。
 */
const API_LAYER_CASE_NAMES = [
  'apiScope 服務分層:那一層有自己的 .config.js 時,資源是那一層',
  'apiScope 單純分類:那一層沒有 .config.js 時,資源仍是檔名',
  'apiScope 分類層底下檔名對不上,照樣要報',
  'apiScope 資料夾結構對得上頁面的,不必有自己的 .config.js',
]

const onCheckApiLayers = () => {
  /* 資源名取「驗證自己建的那個頁面資料夾」,不是專案真實的第一個資源。
     這一則要的只是「一個對得上頁面資料夾的名字」—— 規則判斷的是
     「這一層有沒有自己的 .config.js」,不是名字叫什麼。

     用真實資源名的話,api 目錄底下那個同名的資料夾多半本來就存在
     (設定正確的專案一定有),而這一則結束時會把它刪掉 ——
     連同裡面真正的 api 檔案。 */
  const resource = [...(listViewFolders(root) ?? [])].find(isProbeName)

  if (!resource) {
    for (const name of API_LAYER_CASE_NAMES) skipped.push({ name, need: 'probeViewFolder' })
    return
  }

  const apiAbs = path.join(root, ...API_DIR.split('/'))
  const svc = makeProbeDir(path.join(apiAbs, resource))
  const group = makeProbeDir(path.join(apiAbs, `${PROBE}Group`))

  if (!svc || !group) {
    for (const name of API_LAYER_CASE_NAMES) skipped.push({ name, need: 'probeDirFree' })
    return
  }

  const code = `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetX = (data) => fetchApi.get('x', data)\n`
  const scopeOf = (rel) => lintText(root, rel, code).filter((i) => i.rule === 'apiScope')

  try {
    fs.writeFileSync(path.join(svc, '.config.js'), 'export const fetchApi = {}\n', 'utf8')

    const asService = scopeOf(`${API_DIR}/${resource}/list.js`)
    report(!asService.length, API_LAYER_CASE_NAMES[0], asService.map((i) => i.detail))

    const asGroup = scopeOf(`${API_DIR}/${PROBE}Group/${resource}.js`)
    report(!asGroup.length, API_LAYER_CASE_NAMES[1], asGroup.map((i) => i.detail))

    const bad = scopeOf(`${API_DIR}/${PROBE}Group/${PROBE}Nowhere.js`)
    report(bad.length === 1, API_LAYER_CASE_NAMES[2], bad.length ? [] : ['對不上的檔名沒有被報出來'])

    /* 整個專案只有一份連線設定、api 資料夾純粹把檔案依頻道收好的擺法:
       `_api/<資源>/<畫面>.js` 對 `<頁面目錄>/<資源>/<畫面>/`,整段路徑都在。
       不認這種的話,那種專案只剩兩條路 —— 補一支沒有作用的 .config.js,
       或把每一支檔名塞進例外清單,兩種都是為了讓規則過而改程式碼。 */
    const viewSub = [...(listViewSubFolders(root) ?? [])].find((name) =>
      fs.existsSync(path.join(root, ...VIEWS_DIR.split('/'), resource, name))
    )

    if (viewSub) {
      const mirrored = scopeOf(`${API_DIR}/${resource}/${viewSub}.js`)
      report(!mirrored.length, API_LAYER_CASE_NAMES[3], mirrored.map((i) => i.detail))
    } else {
      skipped.push({ name: API_LAYER_CASE_NAMES[3], need: 'probeViewSubFolder' })
    }
  } finally {
    fs.rmSync(svc, { recursive: true, force: true })
    fs.rmSync(group, { recursive: true, force: true })
  }
}

/**
 * 端點裡的固定前綴段不計入函式名 —— 由設定列出(API_NAMING_IGNORED_SEGMENTS)。
 *
 * 有些專案的端點固定帶版本段或服務名(`api/v1/buy/list`),那幾段每一支都一樣,
 * 對讀的人沒有意義;不排掉的話每一支的期望名都多出那一段。
 *
 * 這一則用設定實際列出來的那幾段造探針,沒有設定就跳過 ——
 * 空陣列(本專案就是)代表這個專案沒有那種前綴,驗不到東西是正常的。
 */
const onCheckIgnoredSegments = () => {
  if (!API_NAMING_IGNORED_SEGMENTS.length) return

  const [ignored] = API_NAMING_IGNORED_SEGMENTS
  const rel = `${A}/${PROBE_PAGE_ALPHA}.js`
  const code =
    `import { fetchApi } from './.config.js'\n\n` +
    `export const apiGetProbeThing = (data) => fetchApi.get('${ignored}/probe/thing', data)\n`

  const issues = lintText(root, rel, code).filter((i) => i.rule === 'apiNaming')

  report(
    !issues.length,
    `apiNaming 設定列出的前綴段(${ignored})不計入函式名`,
    issues.map((i) => i.detail)
  )
}

/**
 * 指紋清單要跟現在的規則一致 —— 只在來源檢查。
 *
 * 共用規則的指紋跟著規則一起複製到每個專案,非來源那邊靠它認出「規則被改過」。
 * 來源改了規則卻忘了更新指紋的話,那份清單一到別的專案就全部對不上 ——
 * 每一支都被報成「被改過」,而實際上那邊一個字都沒動。
 *
 * 一整批這種誤報的結果是整條規則被關掉,所以這裡在來源就先擋下來。
 */
const onCheckRuleFingerprints = () => {
  /* 指紋涵蓋哪幾支 —— 這一則在哪一種專案都要驗。
     產生指紋的那一支自己一定要列入:排除它的話,改掉它就能讓比對永遠通過,
     那是一道只有知道的人才找得到的後門,而保護在那之後看起來仍然正常。
     另外兩支則是每個專案本來就可以動的東西,列入的話一裝上去就全部報。 */
  {
    const covered = Object.keys(currentFingerprints())
    const problems = []

    if (!covered.includes('checksum.mjs')) problems.push('少了 checksum.mjs 自己 —— 改掉它就能繞過比對')

    /* 判準取 checksum 那邊的那一份,不在這裡重寫 —— 兩份會有一天對不上,
       而驗證顯示通過的同時,實際的排除範圍已經變了。 */
    for (const name of covered) {
      if (isSkipped(name)) problems.push(`${name} 不該列入 —— 那是這個專案自己的東西`)
    }

    for (const own of ['project-config.mjs', 'rules-project.mjs', 'diff-output-project.mjs']) {
      if (!isSkipped(own)) problems.push(`${own} 應該排除 —— 設定與 -project.mjs 結尾的都是專案自己的`)
    }

    for (const shared of ['rules-global.mjs', 'lint-core.mjs', 'checksum.mjs']) {
      if (isSkipped(shared)) problems.push(`${shared} 不該被排除 —— 那是每個專案拿到的同一套`)
    }

    report(!problems.length, '共用規則的指紋涵蓋範圍正確', problems)
  }

  /* 只有「直接執行指紋那一支」才可以動清單。
     別的工具帶 --write 跑(色票排序就是)而它 import 了指紋模組時,
     不可以順手封存 —— 那等於把被改過的共用規則蓋章,下一次比對當然一致,
     而保護就這樣安靜地失效,沒有任何訊息。

     用子行程驗:argv 帶著 --write 的,是「別的工具」那一種情境。 */
  {
    const file = path.join(root, ...CHECKSUM_FILE.split('/'))
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
    const probe = PROBE_WRITE_FILE
    const problems = []

    fs.writeFileSync(
      probe,
      `import '${pathToFileURL(path.join(root, '.tools/lint/checksum.mjs')).href}'\n`,
      'utf8'
    )

    try {
      execFileSync(process.execPath, [probe, '--write'], { cwd: root, stdio: 'pipe' })

      const after = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
      if (before !== after) problems.push('別的工具帶 --write 執行時,指紋清單被改寫了')
    } catch (err) {
      problems.push(`探測跑不起來:${err.message}`)
    } finally {
      if (fs.existsSync(probe)) fs.unlinkSync(probe)
    }

    report(!problems.length, '指紋清單只有直接執行那一支時才會被改寫', problems)
  }

  /* 清單是不是最新的,只有來源驗得到 —— 別的專案那份清單是跟著規則複製過來的,
     對不上代表那邊改了共用規則,那件事由規則 ruleTampered 在檢查時報,不在這裡。 */
  if (!IS_SOURCE_PROJECT) {
    skipped.push({ name: '共用規則的指紋清單是最新的', need: 'sourceProject' })
    return
  }

  const diff = fingerprintDiff()

  report(
    !diff.length,
    '共用規則的指紋清單是最新的',
    diff.length
      ? [`${diff.map((d) => `${d.name} ${d.state}`).join('、')};改完規則要跑 npm run rules:seal`]
      : []
  )
}

const onCheckProjectRules = () => {
  const codes = Object.keys(projectRules.PROJECT_RULE_TITLE ?? {})
  if (!codes.length) return

  const wrongPrefix = codes.filter((code) => !code.startsWith(PROJECT_RULE_PREFIX))

  report(
    !wrongPrefix.length,
    `專案自己的規則代號以 ${PROJECT_RULE_PREFIX} 開頭`,
    wrongPrefix.length ? [`沒有前綴:${wrongPrefix.join('、')}`] : []
  )

  const tested = new Set(PROJECT_CASES.map((c) => c.rule).filter(Boolean))
  const untested = codes.filter((code) => !tested.has(code))

  report(
    !untested.length,
    '專案自己的規則每一條都有驗證案例',
    untested.length
      ? [`這幾條沒有案例:${untested.join('、')}(案例寫在 rules-project.mjs 的 PROJECT_CASES,用 rule 指定是哪一條)`]
      : []
  )
}

const onCheckRuleCrash = () => {
  let issues = []

  try {
    issues = lintText(root, `${M}/probeCrash.css`, null)
  } catch (err) {
    report(false, '規則壞掉時要報出來,不能安靜跳過', [`整個檢查停擺了:${err.message}`])
    return
  }

  const crashed = issues.filter((i) => i.rule === 'ruleCrashed')

  report(
    crashed.length > 0,
    '規則壞掉時要報出來,不能安靜跳過',
    crashed.length ? [] : ['規則拋錯了,但檢查結果是空的 —— 那會顯示成通過']
  )
}

const onCheckThemeBlocks = () => {
  const light = '&.\\-\\-light'
  const dark = '&.\\-\\-dark'

  const text = [
    '.theme {',
    `  ${light} {`,
    '    --probe-a: #f1f1f1;',
    '    /* 這一行是人寫的說明 */',
    '    --probe-b: #000000;',
    '  }',
    '',
    `  ${dark} {`,
    '    --probe-b: #111111;',
    '    --probe-a: #333333;',
    '  }',
    '}',
    '',
  ].join('\n')

  const blocks = parseColorBlocks(text)

  report(
    blocks.length === 2,
    '色票:巢狀的兩組主題都解析得到',
    blocks.length === 2 ? [] : [`預期 2 組,實際 ${blocks.length} 組`]
  )

  const commented = blocks[0]?.items.find((i) => i.comments.length)

  report(
    commented?.name === '--probe-b',
    '色票:人寫的註解跟著它下方那一行宣告',
    commented?.name === '--probe-b' ? [] : [`預期跟著 --probe-b,實際 ${commented?.name ?? '沒有'}`]
  )

  /* 排序後兩組都要由淺到深,而且那句說明還在。
     說明若消失就是把人寫的東西刪掉了 —— 排序是自動改檔,不會有人收到通知。 */
  const sorted = sortColorCss(text) ?? text
  const sortedBlocks = parseColorBlocks(sorted)

  /* 驗的是排序後每一組的內容,不是字串長什麼樣 ——
     比對字串的話,選擇器換個寫法這一則就會失敗,而排序本身根本沒問題。 */
  const bothSorted =
    sortedBlocks.length === 2 &&
    sortedBlocks.every((block) => block.items.map((i) => i.name).join() === '--probe-a,--probe-b')

  report(
    bothSorted,
    '色票:兩組主題各自排序',
    bothSorted ? [] : [sortedBlocks.map((b) => b.items.map((i) => i.name).join(' ')).join(' | ')]
  )

  report(
    sorted.includes('這一行是人寫的說明'),
    '色票:排序不會刪掉人寫的註解',
    sorted.includes('這一行是人寫的說明') ? [] : ['那句說明在排序後不見了']
  )

  /* 色相分類標籤跟著檔案原本的樣子:排序只換順序,不改風格。
     原本沒有標籤的色票排一次就多出十幾行英文標頭的話,那是自動改檔,
     而且改的是「要不要這種註解」這種專案自己的決定。 */
  const plain = ':root {\n  --probe-b: #000000;\n  --probe-a: #ffffff;\n}\n'
  const plainSorted = sortColorCss(plain) ?? plain
  const gotLabels = /\/\*\s*(?:white|black|other)\s*\*\//.test(plainSorted)
  const reordered = plainSorted.indexOf('--probe-a') < plainSorted.indexOf('--probe-b')

  report(
    !gotLabels && reordered,
    '色票:原本沒有色相標籤的檔案,排序後也不會多出標籤',
    gotLabels ? ['排序替它加上了色相標籤'] : ['排序沒有生效']
  )

  /* 色系之間要空一行 —— 那是規範,每個專案都一樣,不跟著檔案現況走。
     沒有這一則的話,重建時把空行當成可丟棄的空白,整份會變成連續一大串,
     而排序是自動改檔:被刪掉的分隔不會有人收到通知。

     探針的名字要認得出色相(上面那一則的 --probe-a / --probe-b 認不出,
     兩支都算「未知色」,同一組裡本來就不該有空行)。 */
  const hued = ':root {\n  --black-0000: #000000;\n  --white-ffff: #ffffff;\n}\n'
  const huedSorted = sortColorCss(hued) ?? hued
  const blankBetweenHues = /;\n\s*\n\s*--/.test(huedSorted)

  report(blankBetweenHues, '色票:沒有標籤時,色系之間仍然空一行', [
    `排出來的內容:${JSON.stringify(huedSorted)}`,
  ])

  /* 兩組主題時不自動加變數 —— 新變數在淺色與深色該是不同的值,那是設計決定。
     猜一個填進去的話,畫面會錯得很安靜:看起來有值,只是顏色不對。 */
  const added = addColorDecls(text, [{ name: '--probe-c', value: '#0000004d' }])

  report(added === null, '色票:兩組主題時不自動加變數', added === null ? [] : [added])

  const single = ':root {\n  --probe-a: #f1f1f1;\n}\n'
  const singleAdded = addColorDecls(single, [{ name: '--probe-c', value: '#0000004d' }])

  report(
    singleAdded?.includes('--probe-c'),
    '色票:單組主題照樣自動加變數',
    singleAdded?.includes('--probe-c') ? [] : ['單組主題應該要加進去']
  )
}

const SORT_IMPORT_CASES = [
  {
    name: '亂掉的分組會排回去',
    rel: `${C}/SortOrder.vue`,
    code: (() => {
      const lines = orderedImportsOf()
      return `<script setup>\n${[...lines.slice(1), lines[0]].join('\n')}\n</script>\n`
    })(),
    expect: orderedImportsOf(),
  },
  {
    name: '已經是正確順序就不動',
    rel: `${C}/SortOrder.vue`,
    code: `<script setup>\n${orderedImportsOf().join('\n')}\n</script>\n`,
    expect: null,
  },
  {
    /* 頁面載入的東西依它要做的事而定,沒有固定的形狀 ——
       這條規則只管共用元件目錄底下的 .vue。 */
    name: '頁面不在範圍內',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: (() => {
      const lines = orderedImportsOf()
      return `<script setup>\n${[...lines.slice(1), lines[0]].join('\n')}\n</script>\n`
    })(),
    expect: null,
  },
  {
    /* 中間夾了別的程式碼就停 —— 那一行之後的 import 不一定能往上搬,
       例如它要用到上面算出來的東西。 */
    name: '中間夾了別的程式碼就不跨過去',
    rel: `${C}/SortOrder.vue`,
    code: (() => {
      const lines = orderedImportsOf()
      return `<script setup>\n${lines.at(-1)}\nconst probe = 1\n${lines[0]}\n</script>\n`
    })(),
    expect: null,
  },
  {
    /* 註解多半在講下面那一行是什麼,留在原地就指向了別的 import */
    name: '註解跟著下方那一行一起搬',
    rel: `${C}/SortOrder.vue`,
    code: (() => {
      const lines = orderedImportsOf()
      return `<script setup>\n// 說明\n${lines.at(-1)}\n${lines[0]}\n</script>\n`
    })(),
    expect: [orderedImportsOf()[0], '// 說明', orderedImportsOf().at(-1)],
  },
]

/**
 * 宣告順序的自動排序驗證。
 *
 * 這個功能會**直接改動程式碼**,所以除了「排對順序」之外,
 * 更要驗「不該動的絕對不能動」:屏障之間不搬、內容一行都不能少。
 *
 *   rel      檔案路徑(決定「自己頁面」是哪一個)
 *   code     排序前的內容
 *   expect   排序後那幾行的順序;null 代表「應該完全不動」
 */
const SORT_COMPOSABLE_CASES = [
  {
    /* 一組就是「順序有意義的一整串」，中間空一行會讓人以為那是兩段不同的東西；
       而且排序完之後那個空行還會停在原地，夾在不相干的兩筆之間。 */
    name: '組內的空行會被移除',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code:
      '<script setup>\n' +
      'const { onLoaded } = useCommonActions()\n' +
      '\n' +
      'const popup = usePopupActions()\n' +
      '</script>\n',
    expect: ['const { onLoaded } = useCommonActions()', 'const popup = usePopupActions()'],
  },
  {
    /* 順序本來就對、但中間有空行 —— 仍然要處理。
       只看順序的話，這種會被當成「沒事」而留下空行。 */
    name: '順序正確但有空行時照樣要移除',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code:
      '<script setup>\n' +
      'const common = useCommonStore()\n' +
      '\n' +
      'const popup = usePopupStore()\n' +
      '</script>\n',
    expect: ['const common = useCommonStore()', 'const popup = usePopupStore()'],
  },
  {
    /* 夾著註解的間隔要整段留著 —— 那種註解多半在講後面一整段，
       刪掉就是資料遺失。這個函式不報違規、直接改檔，刪錯了沒有人會收到訊息。 */
    name: '間隔夾著註解時整段保留',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code:
      '<script setup>\n' +
      'const common = useCommonStore()\n' +
      '\n' +
      '// 這段在講彈窗\n' +
      'const popup = usePopupStore()\n' +
      '</script>\n',
    expect: [
      'const common = useCommonStore()',
      '// 這段在講彈窗',
      'const popup = usePopupStore()',
    ],
  },
  {
    name: '順序倒置會被排回去',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst popup = usePopupActions()\nconst { onLoaded } = useCommonActions()\n</script>\n`,
    expect: ['const { onLoaded } = useCommonActions()', 'const popup = usePopupActions()'],
  },
  {
    /* computed 一律是屏障,連依賴前一行的 pageJson 也不例外 ——
      不當屏障的話,排序會把 useJsonStore() 搬到 pageJson 之後,
      寫出「用到還沒初始化的變數」的程式碼。這條是自動改檔、不報違規的功能,
      排錯了沒有人會收到訊息,所以寧可少排幾行。 */
    name: 'pageJson 這類 computed 也是屏障,不跨越',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst json = useJsonStore()\nconst pageJson = computed(() => json.selfTestAlpha)\nconst common = useCommonStore()\n</script>\n`,
    expect: null,
  },
  {
    /* 外部平台整合那一項有 useLiffStore 與 useLineLiffStore 兩種常見寫法,
      兩種都要排在 json 之後。只認其中一種的話,另一種會被當成「其他頁面」
      排到 json 前面 —— 而這條是自動改檔、不報違規的,排錯了沒有人會收到訊息。 */
    name: 'useLiffStore 與 useLineLiffStore 都排在 json 之後',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst liff = useLineLiffStore()\nconst json = useJsonStore()\n</script>\n`,
    expect: ['const json = useJsonStore()', 'const liff = useLineLiffStore()'],
  },
  {
    name: '註解跟著宣告一起搬',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\n// 靜態文案\nconst json = useJsonStore()\n// 全站共用\nconst { onLoaded } = useCommonActions()\n</script>\n`,
    expect: [
      '// 全站共用',
      'const { onLoaded } = useCommonActions()',
      '// 靜態文案',
      'const json = useJsonStore()',
    ],
  },
  {
    /* 分類內部的順序:store → storeToRefs → actions。
      storeToRefs 靠參數的變數名認出自己屬於哪一組。 */
    name: '分類內部 Store → storeToRefs → Actions',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst { onLoaded } = useCommonActions()\nconst { device } = storeToRefs(common)\nconst common = useCommonStore()\n</script>\n`,
    expect: [
      'const common = useCommonStore()',
      'const { device } = storeToRefs(common)',
      'const { onLoaded } = useCommonActions()',
    ],
  },
  {
    // storeToRefs 是它那一組的成員,不是屏障 —— common 那一組要整組排到前面
    name: 'storeToRefs 跟著自己那一組移動',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst json = useJsonStore()\nconst { list } = storeToRefs(json)\nconst { onLoaded } = useCommonActions()\n</script>\n`,
    expect: [
      'const { onLoaded } = useCommonActions()',
      'const json = useJsonStore()',
      'const { list } = storeToRefs(json)',
    ],
  },
  {
    name: 'route 與 router 排在最後,route 在前',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst router = useRouter()\nconst route = useRoute()\nconst common = useCommonStore()\n</script>\n`,
    expect: [
      'const common = useCommonStore()',
      'const route = useRoute()',
      'const router = useRouter()',
    ],
  },
  {
    /* ref() 這類語句是屏障。它的初始值可能引用前面任何一個宣告,
      把後面的東西搬過去會用到還沒初始化的變數,程式直接壞掉。 */
    name: 'ref() 是屏障,前後不搬移',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst popup = usePopupActions()\nconst isOpen = ref(false)\nconst common = useCommonStore()\n</script>\n`,
    expect: null,
  },
  {
    name: '自己頁面排在 member 之後',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst alpha = useSelfTestAlphaStore()\nconst member = useMemberStore()\n</script>\n`,
    expect: ['const member = useMemberStore()', 'const alpha = useSelfTestAlphaStore()'],
  },
  {
    // 在 member 自己的頁面裡,member 就是「自己頁面」,排在 nav 之後
    name: 'member 在自己頁面時算自己頁面',
    rel: `${VIEWS_DIR}/member/Setting.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst nav = useNavStore()\n</script>\n`,
    expect: ['const nav = useNavStore()', 'const member = useMemberStore()'],
  },
  {
    name: '同一項 Store 在前 Actions 在後',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst { onLoaded } = useCommonActions()\nconst common = useCommonStore()\n</script>\n`,
    expect: ['const common = useCommonStore()', 'const { onLoaded } = useCommonActions()'],
  },
  {
    name: '已經是正確順序就不動',
    rel: `${VIEWS_DIR}/selfTestAlpha/Index.vue`,
    code: `<script setup>\nconst common = useCommonStore()\nconst json = useJsonStore()\nconst popup = usePopupActions()\n</script>\n`,
    expect: null,
  },
  {
    // 共用元件不在頁面目錄底下,沒有「自己頁面」,所有頁面 store 都算其他頁面
    name: '共用元件也能排',
    rel: `${COMPONENTS_DIR}/mCard/Event.vue`,
    code: `<script setup>\nconst popup = usePopupActions()\nconst common = useCommonStore()\n</script>\n`,
    expect: ['const common = useCommonStore()', 'const popup = usePopupActions()'],
  },
]

/**
 * 把自動產生的清單裡「提到探測名字」的行清掉。
 *
 * 驗證會在元件目錄底下實際建出探測檔,而建置工具在背景監看那一層 ——
 * 它看到新檔案就登記進清單,而探測檔刪掉之後那幾行留著,指向一個不存在的檔案。
 * 不清的話會跟著 commit 擴散出去,看到的人不知道那是什麼:
 * 那幾個名字在專案裡根本找不到。
 *
 * **只刪提到探測名字的那幾行,其餘一個字都不動** —— 那份清單裡其他的東西
 * 是專案真正的內容,而它隨時可能正被別人修改。
 *
 * 監看是非同步的:清完之後它才反應過來的那一次仍會留下幾行,
 * 那幾行會在下一次執行時被這裡清掉(判斷看的是內容,不是「這次是誰寫的」)。
 */
const onCleanGeneratedLists = () => {
  for (const rel of GENERATED_FILES) {
    const abs = path.join(root, ...rel.split('/'))
    if (!fs.existsSync(abs)) continue

    const before = fs.readFileSync(abs, 'utf8')
    const after = withoutProbeLines(before)

    if (after !== before) fs.writeFileSync(abs, after, 'utf8')
  }
}

const cleanup = () => {
  for (const dir of PROBE_DIRS) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true })
  }

  /* 上面那一輪只刪得掉「這一版列出來的」那幾個資料夾。案例會實際寫檔,
     而兩種東西不在那份清單裡:上一次中途失敗留下的,以及改名之前的舊名字 ——
     兩者都不會報錯,只會留下一個看起來像真元件、真色票、真頁面的資料夾,
     而下一次執行會把它們當成真的讀進去,驗證結果開始受殘留影響。

     所以每一個「案例會寫檔的目錄」都要掃過去認名字。逐一列出檔名的話,
     以後新增一支就要記得回來補一行,忘了補同樣沒有徵兆。 */
  for (const { dir: rel, match } of PROBE_SWEEPS) {
    const dir = rel ? path.join(root, ...rel.split('/')) : root
    if (!fs.existsSync(dir)) continue

    for (const name of fs.readdirSync(dir)) {
      if (!match(name)) continue
      fs.rmSync(path.join(dir, name), { recursive: true, force: true })
    }
  }

  while (created.length) {
    fs.rmSync(created.pop(), { recursive: true, force: true })
  }

  /* 探測檔都刪掉之後才清清單 —— 反過來的話,刪檔案這一步會再驚動監看的工具,
     剛清好的那幾行又被寫回去。 */
  onCleanGeneratedLists()
}

/*
 * 被中斷時也要清乾淨。
 *
 * 主流程的 try/finally 攔得到「跑完」與「拋錯」,攔不到訊號 ——
 * 按下中斷鍵、或程序被外面殺掉,那一批探測檔就留在專案裡了。
 *
 * 留下來的後果不只是多幾個檔案:它們看起來像真的元件、色票與頁面,
 * 下一次檢查會把它們當成專案內容掃進去(違規數字莫名其妙地跳),
 * 而最麻煩的是這套工具會被整批複製到別的專案 —— 那幾支跟著過去之後,
 * 那邊沒有人知道它們是什麼、也不敢刪。
 */
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    cleanup()
    process.exit(130)
  })
}

let failed = 0

/* 總數由這裡累加,不在最後把各組的長度加總 —— 加總要記得每一組都列進去,
   漏了哪一組,那一組新增的案例不會讓數字變動,看的人會以為自己補的驗證
   沒有生效(實際上有跑,只是沒被計入)。而單獨寫一則的驗證根本沒有「一組」
   可以加,那種永遠會被漏掉。 */
let total = 0

/** 因為專案的設定而驗不到的案例 —— 結束時要講出來,不能安靜地少驗 */
const skipped = []

/**
 * 案例寫 `needs` 時要成立的前提 —— 不成立就跳過那一則。
 *
 * 每一項都取規則那邊算好的那一份,不在這裡重寫判斷:
 *
 *   breakpoints   專案有分斷點(沒有的話兩條斷點規則整條略過)
 *   suffixNaming  色票用「色相 + 取碼」命名(語意命名的專案取碼那幾條整類跳過)
 *
 * 這兩種都是「規則這次本來就不作用」,案例驗不到東西是正常的;
 * 留著會變成必定失敗的雜訊,而看的人會以為規則壞了。
 */
const NEEDS_MET = {
  breakpoints: BREAKPOINTS.length > 0,
  suffixNaming: isSuffixNamingChecked,
  projectDirValues: PROJECT_DIR_VALUES.length > 0,
  /* 判準與規則那一側同一個值 —— 那邊留空就整條略過,這裡跟著跳過它的案例。
     另寫一份判斷的話,有一天兩邊會對不上:規則不跑而案例還在等它報。 */
  formGroupValidator: !!FORM_GROUP_VALIDATOR,
  /* 沒有那支深拷貝函式的專案,「還原時有沒有深拷貝」分不出來,規則整條略過。
     判準取規則那一側同一個值,不在這裡另寫一份。 */
  deepCloneHelper: !!DEEP_CLONE_HELPER.name,
  /* 沒有 api 規格文件的專案分不出「這個欄位名是不是後端給的」,規則整條略過。 */
  apiSpec: Boolean(apiSpecFields),
}

/** 前提不成立時要講的那一句 —— 只列名字的話,看的人分不出是設定造成的還是規則壞了 */
const SKIP_REASON = {
  breakpoints: '這個專案的 BREAKPOINTS 是空陣列(不做響應式),兩條斷點規則本來就整條略過。',
  suffixNaming:
    '這個專案的色票用語意命名(COLOR_HUE_SOURCE 設成 value),取碼那幾條規則本來就整類跳過。',
  sourceProject:
    '這個專案不是規範工具的來源(SOURCE_PROJECT_NAME 與 PROJECT_NAMES 對不上),' +
    '指紋清單是跟著規則複製過來的,對不上由規則 ruleTampered 在檢查時報。',
  formGroupValidator:
    '這個專案沒有填 FORM_GROUP_VALIDATOR(沒有那種把一組控制項包起來的元件),' +
    '「一組控制項各自帶驗證」那條本來就整條略過。',
  deepCloneHelper:
    '這個專案沒有填 DEEP_CLONE_HELPER(沒有那支深拷貝的共用函式),' +
    '「從 apiDefault 還原要深拷貝」那條分不出哪一處已經寫對,本來就整條略過。',
  apiSpec:
    '這個專案沒有 api 規格文件(設定的 API_SPEC_DIR 留空或檔案不在),' +
    '「前端自己掛的欄位要加底線」那條分不出哪些名字是後端給的,本來就整條略過。',
  probeViewFolder:
    '頁面目錄裡沒有驗證自己建的資料夾(頁面目錄的位置設錯時會這樣),' +
    '而這幾則要一個對得上頁面資料夾的名字才驗得起來。' +
    '改用專案真實的資源名是不行的 —— 那會在結束時刪掉同名的真實 api 目錄。',
  probeDirFree:
    'api 目錄底下已經有同名的資料夾,這幾則跳過。' +
    '驗證只刪自己建起來的東西:已經存在的一律不碰,否則刪的時候會把真正的檔案一起帶走。',
  conventionDocs:
    '這個專案還沒有規範系統自己的說明文件那一層(CONVENTION_DOCS_DIR),' +
    '所以比不出「哪幾條規則沒有被講到」。',
  ownViewPages:
    '這個專案的頁面目錄裡還沒有自己的頁面(只有驗證自己建的探測資料夾),' +
    '「頁面資源在第幾層」是照實際擺法偵測的,沒有頁面可比對時算出來的是探測檔的形狀。',
  projectDirValues:
    '這個專案的目錄設定沒有一個是多段的(例如頁面直接叫 pages),' +
    '而「寫死這個專案的目錄」那條刻意只抓多段值 —— 單段的名字在中文敘述裡到處都是,' +
    '抓了全是誤報。沒有多段值可抓時,那條規則本來就不會報任何東西。',
}

const report = (ok, name, extra = []) => {
  total += 1

  if (ok) {
    console.log(`${GREEN}✔${RESET} ${name}`)
    return
  }
  failed += 1
  console.error(`${RED}✗ ${name}${RESET}`)
  for (const line of extra) console.error(`    ${line}`)
}

try {
  cleanup()
  onPrepare()
  for (const dir of PROBE_DIRS) fs.mkdirSync(path.join(root, dir), { recursive: true })

  // 色票是在 onPrepare 才建的,要重新讀一次才拿得到探測用的那一支
  definedVars = loadDefinedColorVars(root)

  for (const c of CASES) {
    /* 這個專案的設定讓某一條規則整條略過時,驗它的案例也要跟著跳過 ——
       探針驗不到東西,留著只會變成必定失敗的雜訊,而失敗的原因與規則無關。
       跳過的則數最後會印出來,不會安靜地少驗。

       判準一律取規則那邊已經有的那一份,不在這裡重寫一次:
       兩邊各判斷一次的話,規則改了條件而驗證沒跟上,那幾則就會開始亂報。 */
    if (c.needs && !NEEDS_MET[c.needs]) {
      skipped.push({ name: c.name, need: c.needs })
      continue
    }

    const abs = path.join(root, c.file)
    // 有些案例放在模組子資料夾(moduleScope 要靠資料夾名推 class 前綴)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, c.code, 'utf8')

    /* 跨檔的規則要看別的檔案寫了什麼(誰從 apiDefault 還原、誰定義了這個變數),
       那種案例用 context 把情境鋪出來,再檢查 c.file 那一支。 */
    for (const [file, code] of Object.entries(c.context ?? {})) {
      const at = path.join(root, file)
      fs.mkdirSync(path.dirname(at), { recursive: true })
      fs.writeFileSync(at, code, 'utf8')
    }

    /* 上一則案例建好的跨檔索引,對這一則就是舊的 —— 專案裡的檔案剛剛才被改寫。
       不清的話,跨檔的案例會照著上一則的情境判斷,而看起來只是「莫名其妙地不過」。 */
    resetScanCaches()

    const all = lintFile(root, abs, definedVars)

    /* expect 算的是「要擋的」那些 —— 建議級不列入,否則每加一條 warn 規則,
      不相干的案例都會因為多出一筆而失敗。要驗 warn 的案例寫 expectWarn。

      案例可以寫 `rule` 指定只計那一條。探針常常同時觸發別條規則
      (一段元件的程式碼會被元件類、樣式類好幾條看到),不指定的話,
      新增任何一條規則都會讓一批不相干的案例失敗 —— 而失敗的原因
      看起來像是那幾條規則壞了,實際上只是探針多命中了一條。

      沒寫 `rule` 的案例一律不計專案自己的規則(代號以 project: 開頭)。
      那幾條是各專案自己加的,這裡的案例寫的時候不可能預期到 ——
      一個專案加兩條規則,就會有一批既有案例開始失敗,而訊息看起來像規則壞了,
      實際上是探針多命中了那個專案的新規則。專案自己的規則由 PROJECT_CASES 驗,
      那裡每一則都用 `rule` 指定是哪一條,所以不受這個排除影響。 */
    const ofRule = (list) =>
      c.rule ? list.filter((i) => i.rule === c.rule) : list.filter((i) => isSharedRule(i.rule))

    const issues = ofRule(all.filter((i) => i.level !== 'warn'))
    const warns = ofRule(all.filter((i) => i.level === 'warn'))

    const countOk = issues.length === c.expect
    const warnOk = c.expectWarn === undefined || warns.length === c.expectWarn
    const keywordOk = !c.keyword || [...issues, ...warns].some((i) => i.detail.includes(c.keyword))
    const pass = countOk && warnOk && keywordOk

    report(
      pass,
      c.name,
      pass
        ? []
        : [
            `預期 ${c.expect} 筆${c.expectWarn === undefined ? '' : ` + 建議 ${c.expectWarn} 筆`}` +
              `${c.keyword ? `、含關鍵字「${c.keyword}」` : ''},實際 ${issues.length} 筆` +
              `${warns.length ? ` + 建議 ${warns.length} 筆` : ''}`,
            ...all.map((i) => `L${i.line} [${i.rule}]${i.level === 'warn' ? '(建議)' : ''} ${i.detail}`),
          ]
    )
  }

  /* 進入頁面要拿的資料自動包成一起發出。
     這個功能會**改寫程式碼**,所以除了「該包的有包」之外,
     更要驗「不該包的絕對不能包」—— 後面用到前面結果的那種一起發出會拿到空值,
     而且不會報錯。 */
  for (const c of WRAP_MOUNTED_CASES) {
    const result = onWrapMountedCalls(c.code, `${VIEWS_DIR}/selfTestAlpha/Probe.vue`)
    const problems = []

    if (c.expect === null) {
      if (result !== null) problems.push(`預期完全不動,實際改成:\n${result}`)
    } else if (result === null) {
      problems.push('預期會包起來,實際沒有變動')
    } else if (!c.expect.every((line) => result.includes(line))) {
      problems.push(`預期含有 ${JSON.stringify(c.expect)},實際:\n${result}`)
    }

    report(!problems.length, `wrapMounted ${c.name}`, problems)
  }

  /* 從 apiDefault 還原時的深拷貝自動修正。
     同樣會改寫程式碼,所以「不該動的絕對不能動」也要驗 ——
     補不上 import 卻換了寫法的話,整支檔案會找不到那支函式。 */
  for (const c of CLONE_DEFAULT_CASES) {
    const rel = c.rel ?? `${STORE_DIR}/${ACTIONS_DIR_NAME}/useAlphaActions.js`
    const result = onCloneApiDefault(c.code, rel)
    const problems = []

    if (c.expect === null) {
      if (result !== null) problems.push(`預期完全不動,實際改成:\n${result}`)
    } else if (result === null) {
      problems.push('預期會換成深拷貝,實際沒有變動')
    } else if (!c.expect.every((line) => result.includes(line))) {
      problems.push(`預期含有 ${JSON.stringify(c.expect)},實際:\n${result}`)
    }

    report(!problems.length, `cloneDefault ${c.name}`, problems)
  }

  /* 跨檔案的撞色檢查:分組色票與共用色票用了同一個色值。
     它不走 lintFile(單檔看不到全貌),所以上面每一個案例都不會經過它 ——
     這裡直接呼叫一次,確認它跑得起來而且回傳的是違規清單的形狀。
     沒有這一則的話,這條檢查壞掉時,全部案例仍然會顯示通過。 */
  {
    let problems = []
    try {
      const result = checkSharedColors(root)
      if (!Array.isArray(result)) problems.push('回傳的不是陣列')
      else if (result.some((i) => !i.file || !i.rule)) problems.push('違規物件缺少 file 或 rule')
    } catch (err) {
      problems = [`執行時發生錯誤:${err.message}`]
    }

    report(!problems.length, '跨檔案的色票撞色檢查跑得起來', problems)
  }

  /* 「有哪些共同前提、有哪些寫法規範」兩份清單是從目錄長出來的,
     hook 直接把它們印進提醒裡。這兩支不走 lintFile,壞掉的話不會有任何案例失敗 ——
     提醒裡的規則清單會變成空的,而且沒有人會發現它消失了。

     不驗「有幾份」,那會隨專案而不同;驗的是「讀得到、欄位齊全」。 */
  {
    const problems = []

    const rules = listConventionRules(root)
    if (!rules.length) problems.push('一份共同前提都讀不到')
    if (rules.some((r) => !r.file || !r.summary)) problems.push('有規則缺少 file 或 summary')

    const sorted = rules.every((r, i) => i === 0 || rules[i - 1].priority <= r.priority)
    if (!sorted) problems.push('沒有依 priority 排序')

    const skills = listConventionSkills(root)
    if (!skills.length) problems.push('一份寫法規範都讀不到')
    if (skills.some((s) => !s.name)) problems.push('有寫法規範缺少名稱')

    report(!problems.length, '共同前提與寫法規範的清單讀得到,且依順位排序', problems)
  }

  for (const c of SORT_CASES) {
    const actual = isSorted(c.code)
    report(actual === c.sorted, c.name, actual === c.sorted ? [] : [`預期 ${c.sorted},實際 ${actual}`])
  }

  for (const c of HUE_SOURCE_CASES) {
    const actual = hueOf(...c.args)
    report(actual === c.hue, c.name, actual === c.hue ? [] : [`預期 ${c.hue},實際 ${actual}`])
  }

  for (const c of LEGACY_RGBA_CASES) {
    const result = onFixLegacyRgba(c.code, c.rel, { definedVars })
    const problems = []

    if (c.expect === null) {
      if (result) problems.push('預期完全不動,實際被改了')
    } else if (!result) {
      problems.push('預期會轉換,實際沒有變動')
    } else {
      const line = result.text.split('\n').find((l) => l.trim() === c.expect)
      if (!line) problems.push(`找不到預期的「${c.expect}」,實際:${result.text.trim()}`)

      for (const r of c.renamed ?? []) {
        const [from, to] = r.split(' -> ')
        if (!result.renamed.some((x) => x.from === from && x.to === to)) {
          problems.push(`預期改名 ${r},實際:${JSON.stringify(result.renamed)}`)
        }
      }
    }

    report(!problems.length, c.name, problems)
  }

  onCheckViewDepth()
  onCheckConfigItem()
  onCheckUnderAny()
  onCheckStoreDeclareCall()
  onCheckSingleModuleVars()
  onCheckApiFieldSources()
  onCheckCleanupOnSignal()
  onCheckProbeDirSafety()
  onCheckCaseFilesInProbeDirs()
  onCheckGeneratedCleanup()
  onCheckRulesDocumented()
  onCheckRulesInConventions()
  onCheckPreflightCoverage()
  onCheckWarnRulesVerified()
  onCheckThemeBlocks()
  onCheckRuleCrash()
  onCheckProjectRules()
  onCheckRuleFingerprints()
  onCheckApiLayers()
  onCheckIgnoredSegments()
  onCheckEveryCheckRuns()

  for (const c of MAJORITY_CASES) {
    const actual = majorityHueSource(c.style)
    const ok = actual === c.majority
    report(ok, c.name, ok ? [] : [`預期 ${c.majority},實際 ${actual}`])
  }

  for (const c of SORT_COMPOSABLE_CASES) {
    const result = onSortComposables(c.code, c.rel)
    const problems = []

    if (c.expect === null) {
      if (result !== null) problems.push('預期完全不動,實際被改了')
    } else if (result === null) {
      problems.push('預期會排序,實際沒有變動')
    } else {
      const got = result
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && l !== '<script setup>' && l !== '</script>')

      if (!c.expect.every((line, i) => got[i] === line)) {
        problems.push(`順序不符 —— 預期 ${JSON.stringify(c.expect)},實際 ${JSON.stringify(got)}`)
      }

      /* 內容一行都不能少 —— 排序只換位置,不該讓任何一行消失或多出來。
        少一行就是把程式碼刪掉了,那比排錯順序嚴重得多。 */
      const linesOf = (t) =>
        t
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .sort()

      const before = linesOf(c.code)
      const after = linesOf(result)

      if (before.length !== after.length || !before.every((l, i) => l === after[i])) {
        problems.push('排序前後的內容對不上 —— 有行被刪掉或多出來')
      }
    }

    report(!problems.length, `composableSort ${c.name}`, problems)
  }

  for (const c of SORT_IMPORT_CASES) {
    const result = onSortImports(c.code, c.rel)
    const problems = []

    if (c.expect === null) {
      if (result !== null) problems.push(`預期完全不動,實際被改成:${result.trim()}`)
    } else if (result === null) {
      problems.push('預期會排序,實際沒有變動')
    } else {
      const got = result
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && l !== '<script setup>' && l !== '</script>')

      if (!c.expect.every((line, i) => got[i] === line)) {
        problems.push(`順序不符 —— 預期 ${JSON.stringify(c.expect)},實際 ${JSON.stringify(got)}`)
      }

      /* 內容一行都不能少 —— 排序只換位置,不該讓任何一行消失或多出來 */
      const linesOf = (t) =>
        t
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .sort()

      const before = linesOf(c.code)
      const after = linesOf(result)

      if (before.length !== after.length || !before.every((l, i) => l === after[i])) {
        problems.push('排序前後的內容對不上 —— 有行被刪掉或多出來')
      }
    }

    report(!problems.length, `importSort ${c.name}`, problems)
  }

  for (const c of EMPTY_RULE_CASES) {
    const result = onRemoveEmptyRules(c.code, { rel: c.rel })
    const out = result ?? c.code

    const problems = []
    if (c.changed ? result === null : result !== null) {
      problems.push(`預期 ${c.changed ? '有' : '沒有'}變動,實際相反`)
    }
    if (c.expectKeep && !out.includes(c.expectKeep)) problems.push(`不該被刪:${c.expectKeep}`)
    if (c.expectDrop && out.includes(c.expectDrop)) problems.push(`應該要刪掉:${c.expectDrop}`)

    report(!problems.length, c.name, problems)
  }
} finally {
  cleanup()
}

console.log('')

/* 跳過的一定要講出來 —— 少驗幾則與全部通過在畫面上長得一樣,
   不講的話,設定改成不做響應式的專案會以為斷點規則還在保護它。 */
if (skipped.length) {
  console.log(`${YELLOW}${skipped.length} 則因為這個專案的設定而沒有驗:${RESET}`)

  /* 依前提分組列出,並各自講出「為什麼這次不作用」——
     只列名字的話,看的人不知道那是設定造成的還是規則壞了。 */
  for (const [need, reason] of Object.entries(SKIP_REASON)) {
    const names = skipped.filter((s) => s.need === need)
    if (!names.length) continue

    console.log(`  ${names.map((s) => s.name).join('、')}`)
    console.log(`    ${reason}`)
  }

  console.log('')
}

console.log(
  failed
    ? `${RED}${BOLD}${failed} 個案例未通過 —— 規則可能已失效,修好再繼續。${RESET}`
    : `${GREEN}${BOLD}全部通過(${total} 個案例)${RESET}`
)

process.exit(failed ? 1 : 0)
