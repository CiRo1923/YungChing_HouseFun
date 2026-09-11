// 頁面規範 —— 頁面怎麼用 store 與 actions。
//
// 與 rules-store.mjs 分開:那支管的是「store 與 actions 自己怎麼寫」,
// 這支管的是「頁面怎麼使用它們」。範圍不同(一個看 stores/,一個看頁面的 .vue),
// 混在一起之後,要找某條規則得先猜它算 store 還是頁面的事。

import path from 'node:path'
import { aliasListOf } from './rules-code.mjs'
import {
  ACTIONS_DIR_NAME,
  API_DIR,
  PARALLEL_AWAIT_HELPER,
  STORE_DIR,
  VIEWS_DIR,
  bodyRangeOf,
  isComponentFile,
  isInSrc,
  hasExemptMark,
  issueOf,
  lineNoOf,
} from './shared.mjs'

const ACTIONS_DIR = `${STORE_DIR}/${ACTIONS_DIR_NAME}`

const isPageFile = (rel) => rel.startsWith(`${VIEWS_DIR}/`) && rel.endsWith('.vue')

// --- 規則 pageApiData:頁面不要自建 api 資料 ---------------------------------
//
// api 回來的資料一律放 store。頁面自己 ref 一份的話,那份資料只活在這個元件裡:
//   - 跳 popup / 換頁再回來 → 元件重建,資料沒了,得重新打一次 api
//   - 同一份資料被兩個元件各抓一次 → 兩邊的值可能不一致
//   - 別的元件要用同一份資料時,只能再打一次 api 或層層傳 props
//
// 放進 store 之後,跨頁面與 popup 都直接讀同一份,不會有「資料抓不到」的問題。
//
// 畫面狀態(開關、輸入值、目前分頁)留在元件裡是對的,這條只管 api 回來的資料。

const OWN_API_STATE_RE =
  /^\s*const\s+(\w*api(?:Data|Result|List|Info)\w*)\s*=\s*(?:ref|reactive|shallowRef|shallowReactive)\s*\(/gim

const checkPageApiData = ({ rel, text }) => {
  if (!isPageFile(rel)) return []

  return [...text.matchAll(OWN_API_STATE_RE)].map((m) =>
    issueOf(
      rel,
      lineNoOf(text, m.index),
      'pageApiData',
      `頁面自建了 ${m[1]} —— api 資料放 ${STORE_DIR} 的對應 store,跳 popup / 換頁回來才不會整份消失、也不會兩個元件各抓一次`
    )
  )
}

// --- 規則 pageActionNaming:頁面包裝 action 的命名 ---------------------------
//
// 三層命名一路對得上,往下各去掉一段:
//
//   api 檔    apiGetMemberVoucherID       api + Method + endpoint
//   action    onApiGetMemberVoucherID     api 名前面加 on
//   頁面      onMemberVoucherID           去掉 Api 與 method 那一段
//
// 頁面那層把 Api 與 method 拿掉,是因為在頁面裡它就是個一般的事件處理函式
// (通常還會接 callback、開關 loading),method 是底層的事;但 endpoint 留著,
// 才看得出它背後打的是哪一支 api。
//
// **例外:去掉 method 之後會撞名的,就保留 method 那一段。**
//
//   讀一筆  apiGetMemberPetID  → onApiGetMemberPetID    → onMemberPetID
//   刪一筆  apiDeleteMemberPetID → onApiDeleteMemberPetID → onDeleteMemberPetID
//
// 刪除那支保留了 Delete —— 去掉的話會與上面那支同名。
//
// 同一個 endpoint 有兩個 method 時(讀一筆、刪一筆),method 正是區分它們的
// 唯一資訊。兩支都去掉的話,同一支檔案裡會出現兩個同名的函式,
// 那不只是命名不好看,是程式直接壞掉。
//
// 撞名時「少去掉一段」而不是「加後綴」:這樣它與 action 那層只差一個 Api,
// 而 method 擺在前面也與 api 檔的命名順序一致。

/**
 * HTTP method 那一段 —— 頁面那層要去掉它。
 *
 * 後面接的 `Form`(送出的是表單格式)也屬於 method 那一段,一起去掉:
 * `onApiPostFormPhotoUpload` 在頁面那層是 `onPhotoUpload`。
 * 只剝掉 `Post` 的話會留下 `onFormPhotoUpload`,那個 `Form` 講的是送出方式,
 * 不是 endpoint 的一部分,留著會讓頁面的命名與其他 api 對不齊。
 */
const METHOD_SEGMENT_RE = /^(?:Get|Post|Put|Patch|Delete)(?:Form)?/

/** 不是 api 包裝的通用工具 —— 名字剛好也是 onApi 開頭,但不對應任何一支 api */
const ACTION_UTILS = new Set(['onApiPromise', 'onApiError'])

const PAGE_FN_RE = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g

const checkPageActionNaming = ({ rel, text }) => {
  // 元件也會包裝 action,不限頁面目錄
  if (!isInSrc(rel) || !rel.endsWith('.vue')) return []

  /* 先收齊這支檔案裡所有包裝 action 的函式,再一起判斷 ——
     「去掉 method 之後會不會與別支撞名」要看過整份檔案才知道。 */
  const wrappers = []

  for (const m of text.matchAll(PAGE_FN_RE)) {
    const body = bodyRangeOf(text, m.index + m[0].length - 1)

    const called = [
      ...new Set(
        [...body.matchAll(/\b(onApi[A-Z]\w*)\s*\(/g)]
          .map((x) => x[1])
          .filter((x) => !ACTION_UTILS.has(x))
      ),
    ]

    if (!called.length) continue
    if (called.length > 1) continue // 打多支時無法斷定該用哪一支的名字

    const withoutApi = called[0].replace(/^onApi/, '')

    wrappers.push({
      name: m[1],
      called: called[0],
      index: m.index,
      // onApiGetMemberVoucherID → GetMemberVoucherID → MemberVoucherID → onMemberVoucherID
      short: `on${withoutApi.replace(METHOD_SEGMENT_RE, '')}`,
      // 撞名時用的完整形:只去掉 Api,method 留著
      full: `on${withoutApi}`,
    })
  }

  /* 去掉 method 之後撞在一起的那幾支,改用保留 method 的名字。
     不這樣做的話,規則會建議一個「照著改就會出現兩個同名函式」的名字。

     撞名的那一組裡,**讀取那支維持短名**,其餘才帶 method ——
     讀一筆是這個 endpoint 的預設操作,寫入與刪除是對它做的事。
     全部都帶的話,最常用的那支名字反而變長了。
     整組都沒有讀取時(例如新增與刪除撞在一起),就每一支都帶。 */
  const byShort = new Map()
  for (const w of wrappers) byShort.set(w.short, [...(byShort.get(w.short) ?? []), w])

  const keepShort = new Set()
  for (const [short, group] of byShort) {
    if (group.length < 2) continue

    const reader = group.find((w) => /^onApiGet/.test(w.called))
    if (reader) keepShort.add(reader)
  }

  const issues = []

  for (const w of wrappers) {
    const isClashing = byShort.get(w.short).length > 1 && !keepShort.has(w)
    const expected = isClashing ? w.full : w.short

    if (w.name === expected) continue

    const why = isClashing
      ? '只去掉 Api —— 這一頁有兩支 api 只差在 method,去掉 method 會撞名'
      : '去掉 Api 與 method 那一段'

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, w.index),
        'pageActionNaming',
        `${w.name} 呼叫的是 ${w.called},名稱要對得上 —— 建議 ${expected}(${why})`
      )
    )
  }

  return issues
}

// --- 規則 componentApiImport / pageApiImport:誰可以直接 import api ----------
//
// 正常的路徑是:api → use*Actions(寫進 store)→ 頁面讀 store。
// 直接 import api 的話,拿到的資料就停在那一支檔案裡 —— 沒有進 store,
// 換頁回來要重打、別的地方要用只能再打一次。
//
// **同一個判斷,兩種對象,例外的出口不同:**
//
//   元件(componentApiImport)
//     元件是被放進畫面裡的零件,同一支可能出現在很多頁、也可能同一頁出現很多次。
//     它自己去要資料的話,出現幾次就打幾次,而且每一份資料各自活在各自的元件裡。
//     元件要什麼資料由使用它的頁面決定並傳進來,或是頁面寫進 store 之後元件去讀。
//     **沒有例外** —— 元件自己去要資料在任何情況下都會有上面那些問題。
//
//   頁面(pageApiImport)
//     一次性的請求(送出後就不再用的表單)直接打是可以的,進 store 反而多繞一圈。
//     但那要想過再決定,不是順手 import ——「真的是一次性」與「偷懶沒寫 actions」
//     寫出來一模一樣,所以一律擋下,確定是前者的在檔頭標 lint-page-api-exempt。
//
// 兩者的判斷完全相同,只有代號與能不能豁免不同 —— 判斷寫成兩份的話,
// 修好一邊的誤報,另一邊還在報。

/** 所有 import 寫法:具名匯入、整包匯入、動態 import */
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

/**
 * 把 import 寫的路徑還原成實際指到的位置。
 *
 * 相對路徑從這支檔案所在的資料夾算;alias 則換成它指向的真實路徑。
 * 認不出來的(第三方套件那些)回 null。
 *
 * 不用「路徑字串裡有沒有 api 目錄的名字」來判斷 —— alias 直接指到 api 目錄時,
 * 路徑裡根本不會出現那個名字(`@api/member.js` 指的就是 api 目錄,
 * 但字串裡沒有目錄名 `_api`),那種專案這條規則會完全沒有作用。
 */
const resolveImport = (root, fromFile, spec) => {
  if (spec.startsWith('.')) {
    return path.resolve(path.dirname(path.resolve(root, fromFile)), spec)
  }

  const hit = aliasListOf(root).find((a) => spec === a.alias || spec.startsWith(`${a.alias}/`))
  if (!hit) return null

  return path.resolve(hit.root, spec.slice(hit.alias.length).replace(/^\//, ''))
}

/**
 * 頁面直接 import api 的豁免。
 *
 * 一次性的請求(送出表單、按一個鈕就結束的動作)不需要把結果放進 store,
 * 直接打是合理的。那種情況在檔頭標這個記號並寫明理由,整支檔案就跳過這條。
 *
 * 「有沒有對應的 actions」不拿來當判準 —— 新功能還沒寫 actions 的時候,
 * 那種判斷會放行,而那正是最該擋下來的時候。由人判斷、理由留在程式碼裡,
 * 下一個人看到才知道那不是漏寫。
 */

const checkPageApiImport = ({ rel, text, root }) => {
  if (!isInSrc(rel) || !rel.endsWith('.vue')) return []

  const isPageExempt = hasExemptMark(text, 'page-api')
  const apiRoot = path.resolve(root, API_DIR)
  const isComponent = isComponentFile(rel)
  const issues = []

  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3]
    if (!spec) continue

    const target = resolveImport(root, rel, spec)
    if (!target) continue
    if (target !== apiRoot && !target.startsWith(apiRoot + path.sep)) continue

    const line = lineNoOf(text, m.index)

    if (isComponent) {
      issues.push(
        issueOf(
          rel,
          line,
          'componentApiImport',
          `元件不能直接 import api —— 元件可能出現在很多頁、同一頁也可能出現很多次,自己去要資料就是出現幾次打幾次;要什麼資料由使用它的頁面傳進來,或頁面寫進 store 之後這裡讀 store`
        )
      )
      continue
    }

    // 元件那一種不受豁免影響 —— 元件一律不能自己去要資料,沒有正當的例外
    if (isPageExempt) continue

    issues.push(
      issueOf(
        rel,
        line,
        'pageApiImport',
        `頁面直接 import 了 api —— 正常路徑是 api → ${ACTIONS_DIR}/use*Actions.js(寫進 store)→ 頁面讀 store,資料才不會跳頁回來就整份消失;真的是一次性的請求(送出表單那種,結果不顯示在畫面上)就在檔頭標 /* lint-page-api-exempt: 理由 */`
      )
    )
  }

  return issues
}

// --- 規則 pageAwaitAll:進入頁面時要拿的資料一起發出 -------------------------
//
// 進入頁面時要拿的資料常常不只一份(列表、文案、會員狀態)。一支一支 await
// 的話,第二支要等第一支回來才開始,使用者等的是每一支的時間加總;
// 包在一起則是同時發出,等的是最慢的那一支。
//
// 只有一支的時候也一律包起來 —— 之後要加第二支時,直接加進陣列就好,
// 不必先把寫法整個改一遍;而且每一頁的初次載入長得一樣,讀的人不必分辨兩種寫法。
//
// 這條只管**進入頁面就要拿的資料**(onMounted 裡的)。使用者觸發的動作
// (送出表單、切換排序)不在此限 —— 那是單一動作,包成陣列反而多一層。
//
// 包裝函式叫什麼、從哪裡來,定義在 project-config.mjs 的 PARALLEL_AWAIT_HELPER;
// 專案沒有這支共用函式時整條略過。

const { name: PARALLEL_HELPER, source: PARALLEL_HELPER_SOURCE } = PARALLEL_AWAIT_HELPER

/** 呼叫 action 的形狀:onApiXxx( … ) */
const ACTION_CALL_RE = /\bon(?:Api|Json)\w*\s*\(/g

/**
 * onMounted( … ) 的完整內容,連同它在原文的起訖位置。
 *
 * 用括號配對找結尾,不用正規表示式 —— onMounted 裡面常常還有別的括號,
 * 正規表示式抓不出正確的結尾。
 */
const mountedBlockOf = (text) => {
  const start = text.search(/\bonMounted\s*\(/)
  if (start === -1) return null

  const open = text.indexOf('(', start)
  let depth = 0

  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1
    else if (text[i] === ')') {
      depth -= 1
      if (depth === 0) return { start, end: i + 1, body: text.slice(start, i + 1) }
    }
  }

  return null
}

const checkPageAwaitAll = ({ rel, text }) => {
  if (!PARALLEL_HELPER || !isPageFile(rel)) return []

  const block = mountedBlockOf(text)
  if (!block) return []

  const calls = [...block.body.matchAll(ACTION_CALL_RE)]
  if (!calls.length) return []
  if (block.body.includes(`${PARALLEL_HELPER}(`)) return []

  return [
    issueOf(
      rel,
      lineNoOf(text, block.start),
      'pageAwaitAll',
      `onMounted 裡的 ${calls.length} 支請求要用 ${PARALLEL_HELPER}([ … ]) 包起來 —— 一支一支等的話,使用者等的是每一支的時間加總;存檔時會自動包好`
    ),
  ]
}

/**
 * 一行 `await onApiXxx( … )` —— 前面不能接收回傳值。
 *
 * `const { data } = await onApiXxx()` 那種不算:它把結果存起來給後面用,
 * 包進陣列之後就拿不到了。
 */
const AWAIT_CALL_LINE_RE = /^(\s*)await\s+(on(?:Api|Json)\w*\s*\([^;]*?\))\s*;?\s*$/

/**
 * 這幾個呼叫能不能安全地一起發出。
 *
 * 不能的情況只有一種:**後面那支用到了前面那支的東西**。
 * 一起發出就是同時開始,誰先回來不一定 —— 後面那支需要前面的結果時,
 * 它會拿到還沒準備好的值,而且不會報錯,只是資料是空的。
 *
 * 判斷方式:把前面每一支的參數裡出現過的變數名收集起來,
 * 看後面那幾支的參數有沒有用到。用到就整段不動,交給人決定。
 */
const canRunTogether = (calls) => {
  const seen = new Set()

  for (const call of calls) {
    const args = call.slice(call.indexOf('(') + 1, call.lastIndexOf(')'))
    const names = [...args.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1])

    if (names.some((n) => seen.has(n))) return false

    // 這一支呼叫本身的名字,後面那幾支若拿它當參數就是有依賴
    const fnName = call.slice(0, call.indexOf('(')).trim()
    seen.add(fnName)
    names.forEach((n) => seen.add(n))
  }

  return true
}

/**
 * 把 onMounted 裡連續的 `await onApiXxx()` 併成一次一起發出。
 *
 * 回傳改寫後的整份內容;沒有可改的地方回 null。
 *
 * 這個函式會直接改動程式碼,所以只在**確定不改變結果**時才動手:
 *      1. 只處理形狀單純的整行 await,接收回傳值的那種一律不碰
 *      2. 後面用到前面結果的不合併(那會拿到還沒準備好的值)
 *      3. 已經包好的不重複包
 *    判斷不出來就整段留著,讓規則報出來由人處理 —— 少改一段沒有損失,
 *    改壞一段卻不會有任何徵兆。
 */
export const onWrapMountedCalls = (text, rel) => {
  if (!PARALLEL_HELPER || !isPageFile(rel)) return null

  const block = mountedBlockOf(text)
  if (!block) return null
  if (block.body.includes(`${PARALLEL_HELPER}(`)) return null

  const lines = block.body.split('\n')
  const hits = []

  lines.forEach((line, i) => {
    const m = line.match(AWAIT_CALL_LINE_RE)
    if (m) hits.push({ index: i, indent: m[1], call: m[2].trim() })
  })

  if (!hits.length) return null

  /* 連續的那幾行才併在一起 —— 中間夾了別的語句代表那幾支之間有順序,
     跨過去合併會把「先做這件事再打那支」的安排打散。 */
  const groups = []
  for (const hit of hits) {
    const last = groups.at(-1)
    if (last && hit.index === last.at(-1).index + 1) last.push(hit)
    else groups.push([hit])
  }

  const usable = groups.filter((g) => canRunTogether(g.map((h) => h.call)))
  if (!usable.length) return null

  const next = [...lines]
  for (const group of usable) {
    const calls = group.map((h) => h.call).join(', ')
    next[group[0].index] = `${group[0].indent}await ${PARALLEL_HELPER}([${calls}])`
    for (const hit of group.slice(1)) next[hit.index] = null
  }

  const body = next.filter((l) => l !== null).join('\n')
  const rebuilt = text.slice(0, block.start) + body + text.slice(block.end)

  return withHelperImport(rebuilt)
}

/**
 * 補上包裝函式的 import —— 已經有就原樣回傳。
 *
 * 沒有這一步的話,自動包完的頁面會因為找不到那支函式而整頁壞掉,
 * 比沒有包更糟。
 */
const withHelperImport = (text) => {
  if (new RegExp(`\\b${PARALLEL_HELPER}\\b`).test(text.split('\n').filter((l) => /^\s*import\s/.test(l)).join('\n'))) {
    return text
  }

  const lines = text.split('\n')

  // 已經從同一支來源 import 別的東西時,加進那一行的大括號裡
  const sameSource = lines.findIndex((l) =>
    new RegExp(`^\\s*import\\s*\\{[^}]*\\}\\s*from\\s*['"]${PARALLEL_HELPER_SOURCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(l)
  )

  if (sameSource !== -1) {
    lines[sameSource] = lines[sameSource].replace(/\{\s*/, `{ ${PARALLEL_HELPER}, `)
    return lines.join('\n')
  }

  // 沒有的話放在最後一行 import 之後
  const lastImport = lines.reduce((acc, l, i) => (/^\s*import\s/.test(l) ? i : acc), -1)
  const statement = `import { ${PARALLEL_HELPER} } from '${PARALLEL_HELPER_SOURCE}'`

  if (lastImport === -1) {
    const scriptLine = lines.findIndex((l) => /<script\b/.test(l))
    if (scriptLine === -1) return text
    lines.splice(scriptLine + 1, 0, statement)
  } else {
    lines.splice(lastImport + 1, 0, statement)
  }

  return lines.join('\n')
}

export const PAGE_CHECKS = [
  checkPageApiData,
  checkPageActionNaming,
  checkPageApiImport,
  checkPageAwaitAll,
]

export const PAGE_RULE_TITLE = {
  pageApiData: '頁面自建 api 資料',
  pageActionNaming: '頁面包裝 action 的命名',
  pageApiImport: '頁面直接 import api',
  componentApiImport: '元件直接 import api',
  pageAwaitAll: '進入頁面時的請求沒有一起發出',
}

export const PAGE_RULE_HINT = {
  pageApiData: 'api 資料放 store,頁面不要自己 ref 一份 —— 跳 popup / 換頁回來才不會消失',
  pageActionNaming: 'on + endpoint(去掉 Api 與 method)—— 三層命名一路對得上',
  pageApiImport: `api 走 ${ACTIONS_DIR} 進 store,頁面讀 store`,
  componentApiImport: '元件不去要資料 —— 由使用它的頁面傳進來,或頁面寫進 store 之後元件讀 store',
  pageAwaitAll: `onMounted 裡的請求用 ${PARALLEL_AWAIT_HELPER.name}([ … ]) 一起發出 —— 存檔時自動包好`,
}
