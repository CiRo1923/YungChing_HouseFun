#!/usr/bin/env node
// 規則自我驗證 —— 確認每條檢查「真的抓得到違規」,而且「不會誤報合法寫法」。
//
//   npm run test:css
//
// ⚠️ 為什麼需要這個:npm run lint:css 通過只代表「現在的程式碼沒有違規」,
//    不代表「規則還有效」。改壞一條 regex 之後全案照樣通過 —— 那條規則從此靜靜失效,
//    等到有人寫出違規才發現,而那時已經散了一堆。
//    這支反過來測工具本身:餵違規進去必須被抓、餵合法寫法進去必須放行。
//
// 走的是 lintFile 的完整路徑(而不是直接呼叫各個 check),所以連「哪個路徑跑哪些檢查」
// 的分派邏輯也一起驗到。
//
// ⚠️ 探測檔會實際寫進專案目錄(檢查依路徑前綴決定要不要跑,不能寫在別處)。
//    每次執行前會先清掉前一次的殘骸,結束時(含中途丟例外)一定會刪除。
//
// ⚠️ dev server 執行中時跑這支,自動產生型別的外掛(unplugin-vue-components)
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

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COLOR_NAME_SEPARATOR,
  expectedSuffix,
  hueOf,
  isSorted,
  loadDefinedColorVars,
  majorityHueSource,
} from './color-order.mjs'
import {
  checkSharedColors,
  lintFile,
  onRemoveEmptyRules,
  onFixLegacyRgba,
  onSortComposables,
  onSortImports,
  onWrapMountedCalls,
} from './lint-core.mjs'
import { aliasListOf, importGroupOf, tailwindThemeOf } from './rules-code.mjs'
import { IS_SOURCE_PROJECT, unusedConfigNames } from './rules-global.mjs'
import {
  ACTIONS_DIR_NAME,
  API_DIR,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COLOR_CSS_PREFIX,
  COMPONENTS_DIR,
  CSS_MODULES_DIR,
  IMPORT_ORDER_GROUPS,
  PROJECT_DOCS_DIR,
  PROJECT_NAMES,
  PROJECT_NAME_SCOPE,
  SHARED_API_FILE,
  SOURCE_PROJECT_NAME,
  SRC_DIR,
  STANDALONE_STORES,
  STORE_DIR,
  TAILWIND_THEME_OVERRIDES,
  VIEW_RESOURCE_DEPTH,
  VIEWS_DIR,
} from './project-config.mjs'
import { detectViewResourceDepth, listConventionRules, listConventionSkills } from './shared.mjs'
import { BOLD, GREEN, RED, RESET } from './colors.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

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

/** CSS 模組規則的探測檔 */
const M = `${CSS_MODULES_DIR}/${PROBE}`

/** 共用元件規則的探測檔(template 不寫 tailwind class 那條) */
const C = `${COMPONENTS_DIR}/${PROBE}`

/** moduleScope 靠資料夾名推出 class 前綴,所以要放在合乎模組命名的資料夾底下 */
const S = `${CSS_MODULES_DIR}/mCssSelfTest` // 前綴為 m-css-self-test

/**
 * api 規則看的是「檔名對不對得上頁面目錄的資料夾」,所以探測檔要放在 api 目錄底下。
 *
 * ⚠️ 放**子資料夾**而不是直接放在 api 目錄第一層 —— 探測檔名會與正式檔案撞名,
 *    直接放的話會覆蓋掉真的 api 檔案。規則只看檔名,放子資料夾一樣驗得到。
 */
const A = `${API_DIR}/${PROBE}`

/** store 規則的探測檔 —— 同樣放子資料夾,避免與正式的 store 撞名覆蓋 */
const T = `${STORE_DIR}/${PROBE}`

/** 頁面規則的探測檔 */
const P = `${VIEWS_DIR}/${PROBE}`

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

const PROBE_DIRS = [M, C, S, A, T, `${T}/${ACTIONS_DIR_NAME}`, P, D, PD]

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

/** 探測用的頁面資料夾。名字取得夠特別,誤留下來一眼看得出是什麼 */
/**
 * 探測頁面資料夾共同的開頭 —— 清除時靠它認出「這幾個是驗證自己建的」。
 *
 * 上一次執行中途失敗時,那些資料夾會留在頁面目錄底下。下一次執行看到它們已經
 * 存在就不會再建,也就不會記進清除清單 —— 於是永遠留在那裡,還會被規則
 * 當成真的頁面資料夾。清除時一律掃過去刪,殘留才不會累積。
 */
const PROBE_PAGE_PREFIX = 'selfTest'

const PROBE_PAGE_ALPHA = `${PROBE_PAGE_PREFIX}Alpha`
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
 * 探測用的樣式設定檔 —— 擺在專案根,因為那條規則只看專案根的設定檔。
 *
 * ⚠️ **不能用專案真正的 tailwind 設定檔名** —— 案例會實際寫入內容,
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

/** 探測用的色值與變數名 —— 用不太可能撞到的值,避免與專案既有色票重複 */
const PROBE_COLOR_VAR = '--gray-4d2c'
const PROBE_COLOR_HEX = '#4d2c1e'

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

/** 規則要比對的對象 —— 頁面資料夾、色票、建置設定 */
const onPrepare = () => {
  onCreateIfMissing(`${VIEWS_DIR}/${PROBE_PAGE_ALPHA}`)
  onCreateIfMissing(`${VIEWS_DIR}/${PROBE_PAGE_PLURAL}`)
  onCreateIfMissing(`${VIEWS_DIR}/${PROBE_PAGE_FLAT}`)

  /* store 的分層規則比對的是「有向後端要資料的頁面」,所以探測用的頁面群裡
     要有一支會呼叫 action 的頁面檔,否則那條規則沒有東西可以比對。

     刻意擺在子資料夾底下 —— 分類資料夾不佔一層,層名要取頁面檔名(detail),
     不是資料夾名。放在第一層的話驗不出這件事。 */
  const probePage = `<script setup>\nonApiSelfTestProbe()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`

  onCreateIfMissing(
    `${VIEWS_DIR}/${PROBE_PAGE_ALPHA}/${PROBE_PAGE_SUB_FOLDER}/${PROBE_PAGE_FILE}`,
    probePage
  )

  /* 第二個頁面群裡放兩支同名的頁面,分別在兩個分類資料夾底下 ——
     撞名時分類資料夾要補回來當一層,不撞的維持扁平,兩種都要驗得到。 */
  onCreateIfMissing(
    `${VIEWS_DIR}/${PROBE_PAGE_PLURAL}/${PROBE_CLASH_FOLDER_A}/${PROBE_PAGE_FILE}`,
    probePage
  )
  onCreateIfMissing(
    `${VIEWS_DIR}/${PROBE_PAGE_PLURAL}/${PROBE_CLASH_FOLDER_B}/${PROBE_PAGE_FILE}`,
    probePage
  )

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
 * 那一類沒有列出任何消失的值時(專案沒有整組覆寫那一類),
 * 改成驗「不報」—— 用一個一定不存在的名字,確認規則不會誤報。
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
      name: `theme ${key} 沒有整組覆寫時不誤報`,
      rule: 'theme',
      file,
      code: codeOf(group?.prefix ? `${group.prefix}self-test-none` : 'selfTestNone:'),
      expect: 0,
    }
  }

  const cls = group.prefix ? `${group.prefix}${dead}` : `${dead}:`

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
    name: 'colorFile 值寫成 var() 要報違規',
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
    name: 'color 用變數不誤報',
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
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  ${PROBE_ALPHA_VAR}x: ${PROBE_ALPHA_HEX};\n}\n`,
    expect: 1,
    keyword: 'COLOR_SUFFIX_PICK',
  },
  {
    /* 長度相同、取碼位置不同 —— 規範允許為了避開同色系撞碼而微調,
       所以給建議值,不斷定是錯的。與上面那則的差別就在長度。 */
    name: 'colorFile 取碼位置不同只給建議',
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
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_NAMING_FILE}`,
    code: `:root {\n  /* gray */\n  --gray-9e: #9e9e9e;\n  --btn-hover: #c20016;\n}\n`,
    expect: 3,
    keyword: '混了兩種命名方式',
  },
  {
    name: 'colorFile 全部都是帶色相的名字,不算混用',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* gray */\n  --gray-9e: #9e9e9e;\n}\n`,
    expect: 0,
  },
  {
    name: 'colorFile 認不出色相時列出可用的色相',
    file: `${COLOR_CSS_DIR}/${PROBE_COLOR_FILE}`,
    code: `:root {\n  /* other */\n  --brand-e566: #e5e5e566;\n}\n`,
    expect: 1,
    keyword: 'red',
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
    file: `${M}/variables.css`,
    code: `/* lint-breakpoint-exempt: 三個斷點的值相同 */\n:root {\n  --probe-pc-px: 10px;\n}\n`,
    expect: 0,
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
  aliveThemeCaseOf(`${M}/theme4.css`),
  {
    name: 'theme 色票變數名內含 sm/md 不誤報',
    file: `${M}/theme5.css`,
    code: `.m-probe {\n  @apply text-[--gray-9e];\n  --probe-md-size: 10px;\n}`,
    expect: 0,
  },
  {
    rule: 'theme',
    name: 'theme .vue 的 script 不掃',
    file: `${C}/Theme6.vue`,
    code: `<script setup>\nconst size = 'text-sm'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 moduleOrder ----------
  {
    name: 'moduleOrder 變數檔排在版型檔後面',
    file: `${C}/Order1.vue`,
    code: `<script setup>\nimport '@css/_modules/mProbe/common.css'\nimport '@css/_modules/mProbe/variables.css'\n</script>\n`,
    expect: 1,
    keyword: '變數要全部先定義完',
  },
  {
    name: 'moduleOrder 正確順序不誤報',
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
    name: 'variable 斷點缺一份',
    file: `${M}/bp1.css`,
    code: `:root {\n  --probe-pc-px: 24px;\n  --probe-tablet-px: 15px;\n}`,
    expect: 1,
    keyword: '--probe-mobile-px',
  },
  {
    name: 'variable 斷點成套不誤報',
    file: `${M}/bp2.css`,
    code: `:root {\n  --probe-pc-px: 24px;\n  --probe-tablet-px: 15px;\n  --probe-mobile-px: 10px;\n}`,
    expect: 0,
  },
  {
    name: 'variable 標了例外註解就放行',
    file: `${M}/bp3.css`,
    code: `/* lint-breakpoint-exempt: 只有桌機版有這個區塊 */\n:root {\n  --probe-pc-px: 24px;\n}`,
    expect: 0,
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
    file: `${M}/needVariables.css`,
    code: `:root {\n  --probe-h: 40px;\n}`,
    expect: 1,
    keyword: '沒有分斷點',
  },
  {
    name: 'variable 顏色與中性值不用分斷點',
    file: `${M}/need2Variables.css`,
    code: `:root {\n  --probe-color: var(--white);\n  --probe-px: 0;\n  --probe-h: auto;\n  --probe-z: 3;\n  --probe-leading: 1.5;\n  --probe-w: 100%;\n}`,
    expect: 0,
  },
  {
    name: 'variable 已分斷點不誤報',
    file: `${M}/need3Variables.css`,
    code: `:root {\n  --probe-pc-h: 40px;\n  --probe-tablet-h: 36px;\n  --probe-mobile-h: 32px;\n}`,
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
    name: 'moduleScope 變體 class 要收斂成母體前綴',
    file: `${S}/switchItem.css`,
    code: `.m-switch-item-header {\n  @apply flex;\n}`,
    expect: 1,
    keyword: '收斂',
  },

  // ---------- 規則 themeNaming ----------
  //
  // 檢查的是樣式設定檔本身，不是使用端。theme 是整組覆寫，
  // 重新定義的值再用 sm / md / lg 等於把剛拿掉的問題原樣搬回來。
  {
    name: 'themeNaming theme 直接定義了尺寸縮寫',
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
    file: `${THEME_SOURCE_FILE}`,
    code: `export const boxShadow = {\n  lg: '0 0 20px #000',\n  default: '0 0 4px #000',\n}\n`,
    expect: 1,
    keyword: '定義了 lg',
  },
  {
    name: 'themeNaming 標了豁免註解就整份放行',
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
    /* 路徑形狀的問題全部歸 absolutePath 這一條,不與 projectName 重複計算 ——
      同一行報兩筆敘述不同的違規,豁免時還得標兩種標記。
      三種作業系統的形狀都要抓,只認一種的話換台機器規則就等於失效。

      第一行往上跳的層數刻意寫得很多,確保一定跳出專案根目錄 ——
      層數少的話,它可能剛好落在某個 alias 涵蓋的位置,那時會多命中一筆
      「離開自己資料夾要用 alias」,而那取決於專案的目錄有幾層深。

      這三行各自命中的規則:
        第 1 行  absolutePath(往上跳三層以上)
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
    file: `${P}/ProbeBrandName.vue`,
    code: `<template>\n  <p>RoyalCanin</p>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'absolutePath:原始碼裡的絕對路徑照樣報',
    file: `${P}/ProbeAbsolutePath.vue`,
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
    file: `${P}/ProbeMark.vue`,
    code: `<script setup>\n// \u{1f527} 存檔時會自動排序\n</script>\n`,
    expect: 1,
    keyword: '裝飾符號',
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
    name: 'apiClient 原生請求只給建議',
    file: `${A}/selfTestAlpha.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nconst xhr = new XMLHttpRequest()\n`,
    expect: 0,
    expectWarn: 1,
    keyword: '繞過',
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
    name: 'apiScope 檔名完全沒有對應資料夾',
    file: `${A}/nowhere.js`,
    code: `import { fetchApi } from '@js/_api/.config.js'\n\nexport const apiGetX = (data) => fetchApi.get('x', data)\n`,
    expect: 1,
    keyword: '搬進 project.js',
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
    keyword: '實例只建在',
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
    expect: 1,
    keyword: 'stores/',
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
    code:
      `import { fetchApi } from '@js/_api/.config.js'\n\n` +
      'export const apiGetVoucherItemID = (id) => fetchApi.get(`voucher/item/${id}`)\n',
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

  // ---------- 規則 importAlias / deprecated / composableOrder ----------
  {
    /* 路徑與預期的 alias 都從專案設定算出來 —— 每個專案的 api 目錄位置與
      alias 名稱都不一樣,寫死的話換一個專案這則永遠不會命中,看起來像規則壞了。 */
    /* 標了豁免才只驗得到 import 路徑那一條 —— 這段程式碼 import 的是 api,
       同時也會觸發「頁面直接 import api」。兩條規則混在一則案例裡的話,
       其中一條的行為改了,另一條的案例也會跟著失敗,看不出是誰壞了。 */
    name: 'importAlias 相對路徑跳出資料夾',
    file: `${P}/Detail.vue`,
    code: `<script setup>\n/* lint-page-api-exempt: 這則在驗 import 路徑的寫法 */\nimport { onDo } from '${apiImportPathOf(P, 'home.js')}'\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'home.js',
  },
  {
    name: 'importAlias 同層相對路徑不誤報',
    file: `${P}/List.vue`,
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
    file: `${P}/Order.vue`,
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
      `    const { config, status, data } = await apiPostQuestionnaireQ3_1({})\n\n` +
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
      `    const { config, status, data } = await apiPostQuestionnaireQ3_1({})\n\n` +
      `    return { config, status, data }\n` +
      `  }\n\n` +
      `  return { onApiPostQuestionnaireQ99 }\n` +
      `}\n`,
    expect: 1,
    keyword: 'apiPostQuestionnaireQ3_1',
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
    file: `${P}/PetClash.vue`,
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
    file: `${P}/PetClash2.vue`,
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
    file: `${P}/PetClash3.vue`,
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
    file: `${P}/Voucher.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onVoucherDetail = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'onMemberVoucherID',
  },
  {
    // 頁面那層要把 Api 與 method 兩段都拿掉：onApiGetMemberVoucherID → onMemberVoucherID
    name: 'pageActionNaming 正確命名不誤報',
    file: `${P}/Voucher2.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onMemberVoucherID = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // method 沒去掉的舊寫法要被抓出來
    name: 'pageActionNaming 沒去掉 method 那一段要被抓',
    file: `${P}/Voucher3.vue`,
    code: `<script setup>\nconst { onApiGetMemberVoucherID } = useMemberActions()\n\nconst onGetMemberVoucherID = async () => {\n  await onApiGetMemberVoucherID({})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'onMemberVoucherID',
  },
  {
    /* postForm 這個 method 連後面的 Form 一起去掉：Form 講的是送出格式（表單），
      不是 endpoint 的一部分。留著會讓這一頁的命名與其他 api 對不齊。 */
    name: 'pageActionNaming postForm 的 Form 也要去掉',
    file: `${P}/Upload.vue`,
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
    file: `${P}/Await1.vue`,
    code: `<script setup>\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nonMounted(async () => {\n  await onApiGetSelfTestAlpha()\n})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: 'awaitAllPromise',
  },
  {
    name: 'pageAwaitAll 已經包好的不誤報',
    file: `${P}/Await2.vue`,
    code: `<script setup>\nimport { awaitAllPromise } from '@js/_prototype.js'\n\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nonMounted(async () => {\n  await awaitAllPromise([onApiGetSelfTestAlpha()])\n})\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 這條只管「進入頁面就要拿的資料」。使用者觸發的動作是單一動作，
      包成陣列反而多一層，不該被抓。 */
    name: 'pageAwaitAll 事件處理函式不受限制',
    file: `${P}/Await3.vue`,
    code: `<script setup>\nconst { onApiGetSelfTestAlpha } = useSelfTestAlphaActions()\n\nconst onSelfTestAlpha = async () => {\n  await onApiGetSelfTestAlpha()\n}\n</script>\n\n<template>\n  <div class="m-probe" @click="onSelfTestAlpha"></div>\n</template>\n`,
    expect: 0,
  },
  {
    /* 用 alias 寫路徑,才只命中這一條 —— 相對路徑會同時觸發「離開自己資料夾要用 alias」,
      那樣就分不出抓到的是哪一條規則。alias 與 api 目錄位置都從專案設定算出來。 */
    name: 'pageApiImport 頁面直接 import api 要擋',
    file: `${P}/Direct.vue`,
    code: `<script setup>\nimport { apiGetMemberInfo } from '${apiAliasImportOf('member.js') ?? apiImportPathOf(P, 'member.js')}'\n\nconst onLoad = () => apiGetMemberInfo()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '頁面直接 import 了 api',
  },
  {
    /* 一次性的請求(送出後就不再用)直接打是合理的,標了豁免就跳過整支。
       「真的是一次性」與「偷懶沒寫 actions」寫出來一模一樣,所以由人標、理由留在程式碼裡。 */
    name: 'pageApiImport 標了豁免就放行',
    file: `${P}/DirectExempt.vue`,
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
    name: 'pageActionNaming 通用工具不受限制',
    file: `${P}/Submit.vue`,
    code: `<script setup>\nconst { onApiPromise, onApiError } = useProjectActions()\n\nconst onSubmit = async () => {\n  onApiPromise('open')\n  onApiError({}, 500, {})\n}\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 pageApiData ----------
  {
    name: 'pageApiData 頁面自建 apiData',
    file: `${P}/Detail.vue`,
    code: `<script setup>\nconst apiData = ref(null)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '頁面自建了 apiData',
  },
  {
    name: 'pageApiData 從 store 取用不誤報',
    file: `${P}/List.vue`,
    code: `<script setup>\nconst exchange = useExchangeStore()\nconst { detail } = storeToRefs(exchange)\nconst apiData = computed(() => detail.value.apiData)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    name: 'pageApiData 一般畫面狀態不誤報',
    file: `${P}/Panel.vue`,
    code: `<script setup>\nconst isOpen = ref(false)\nconst keyword = ref('')\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

  // ---------- 規則 storeToRefs ----------
  {
    name: 'storeToRefs 直接解構 store',
    file: `${P}/Direct2.vue`,
    code: `<script setup>\nconst { info } = useMemberStore()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '直接解構',
  },
  {
    name: 'storeToRefs 把 store 屬性讀成 const',
    file: `${P}/Direct3.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst info = member.info\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 1,
    keyword: '斷了',
  },
  {
    name: 'storeToRefs 正確寫法不誤報',
    file: `${P}/Direct4.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst { info } = storeToRefs(member)\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // $ 開頭是 pinia 自己的 API，不是取值
    name: 'storeToRefs pinia API 不誤報',
    file: `${P}/Direct5.vue`,
    code: `<script setup>\nconst member = useMemberStore()\nconst reset = member.$reset\nmember.$patch({ info: null })\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },
  {
    // use*Actions 是一般 composable，不是 store，直接解構才是對的
    name: 'storeToRefs actions 直接解構不誤報',
    file: `${P}/Direct6.vue`,
    code: `<script setup>\nconst { onApiGetMemberInfo } = useMemberActions()\n</script>\n\n<template>\n  <div class="m-probe"></div>\n</template>\n`,
    expect: 0,
  },

]

/** 整份案例 —— 兩份合起來就是這支腳本實際要跑的 */
const CASES = [...CSS_CASES, ...RULE_CASES]

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

  const configText = fs.readFileSync(path.join(root, '.tools/lint/project-config.mjs'), 'utf8')
  const sources = fs
    .readdirSync(path.join(root, '.tools/lint'))
    .filter((name) => name.endsWith('.mjs') && name !== 'project-config.mjs')
    .map((name) => fs.readFileSync(path.join(root, '.tools/lint', name), 'utf8'))

  const extras = unusedConfigNames(configText, sources).map((i) => i.name)

  report(!extras.length, '本專案的設定檔沒有多出沒人讀的項目', extras.length ? [extras.join('、')] : [])

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
    code: `:root {\n  /* black */\n  --black: #000;\n  --black-30: rgba(var(--black), 0.3);\n}\n`,
    expect: '--black-4d: #0000004d;',
    renamed: ['--black-30 -> --black-4d'],
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
 * 元件 import 分組順序的自動排序驗證。
 *
 * 這個功能會**直接改動程式碼**,所以除了「排對順序」之外,
 * 更要驗「不該動的絕對不能動」:不是元件的檔案不碰、認不出來的寫法整塊不動。
 *
 *   rel      檔案路徑(只有共用元件目錄底下的 .vue 會被排)
 *   code     排序前的內容
 *   expect   排序後 import 那幾行的順序;null 代表「應該完全不動」
 */
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

const cleanup = () => {
  for (const dir of PROBE_DIRS) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true })
  }

  /* 有三處的探測檔沒有自己的資料夾可以整個刪掉,要掃過去認名字清乾淨。
     逐一列出檔名的話,以後新增一支就要記得回來補一行 —— 忘了補不會報錯,
     只會留下一支看起來像真的設定檔、色票或頁面資料夾的垃圾。

     色票目錄與頁面目錄一定要掃:案例會實際寫檔,而上一次中途失敗留下的東西
     不在 created 清單裡(那份只記這次 onPrepare 建的)。留著的話,
     下一次執行會把它們當成真的色票與頁面讀進去,驗證結果就開始受殘留影響。 */
  const sweeps = [
    { dir: root, match: (name) => name.includes(PROBE) },
    {
      dir: path.join(root, ...COLOR_CSS_DIR.split('/')),
      match: (name) => name.startsWith(PROBE_COLOR_PREFIX),
    },
    {
      dir: path.join(root, ...VIEWS_DIR.split('/')),
      match: (name) => name.startsWith(PROBE_PAGE_PREFIX),
    },
  ]

  for (const { dir, match } of sweeps) {
    if (!fs.existsSync(dir)) continue

    for (const name of fs.readdirSync(dir)) {
      if (!match(name)) continue
      fs.rmSync(path.join(dir, name), { recursive: true, force: true })
    }
  }

  while (created.length) {
    fs.rmSync(created.pop(), { recursive: true, force: true })
  }
}

let failed = 0

/* 總數由這裡累加,不在最後把各組的長度加總 —— 加總要記得每一組都列進去,
   漏了哪一組,那一組新增的案例不會讓數字變動,看的人會以為自己補的驗證
   沒有生效(實際上有跑,只是沒被計入)。而單獨寫一則的驗證根本沒有「一組」
   可以加,那種永遠會被漏掉。 */
let total = 0

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
    const abs = path.join(root, c.file)
    // 有些案例放在模組子資料夾(moduleScope 要靠資料夾名推 class 前綴)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, c.code, 'utf8')

    const all = lintFile(root, abs, definedVars)

    /* expect 算的是「要擋的」那些 —— 建議級不列入,否則每加一條 warn 規則,
      不相干的案例都會因為多出一筆而失敗。要驗 warn 的案例寫 expectWarn。

      案例可以寫 `rule` 指定只計那一條。探針常常同時觸發別條規則
      (一段元件的程式碼會被元件類、樣式類好幾條看到),不指定的話,
      新增任何一條規則都會讓一批不相干的案例失敗 —— 而失敗的原因
      看起來像是那幾條規則壞了,實際上只是探針多命中了一條。 */
    const ofRule = (list) => (c.rule ? list.filter((i) => i.rule === c.rule) : list)

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
console.log(
  failed
    ? `${RED}${BOLD}${failed} 個案例未通過 —— 規則可能已失效,修好再繼續。${RESET}`
    : `${GREEN}${BOLD}全部通過(${total} 個案例)${RESET}`
)

process.exit(failed ? 1 : 0)
