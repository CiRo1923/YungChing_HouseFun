// 頁面規範 —— 頁面怎麼用 store 與 actions。
//
// 與 rules-store.mjs 分開:那支管的是「store 與 actions 自己怎麼寫」,
// 這支管的是「頁面怎麼使用它們」。範圍不同(一個看 stores/,一個看頁面的 .vue),
// 混在一起之後,要找某條規則得先猜它算 store 還是頁面的事。

import fs from 'node:fs'
import path from 'node:path'
import { aliasListOf } from './rules-code.mjs'
import {
  ACTIONS_DIR_PATH,
  API_DIR,
  PARALLEL_AWAIT_HELPER,
  POPUP_DIR_NAME,
  STORE_DIR,
  VIEW_UNDERSCORE_FOLDERS,
  BREAKPOINT_SCREENS,
  BUILTIN_POPUP_IDS,
  POPUP_TAGS,
  SCAN_TARGETS,
  VIEWS_DIR,
  bodyRangeOf,
  isComponentFile,
  isInSrc,
  hasExemptMark,
  issueOf,
  lineNoOf,
  ARROW_FN_RE,
  IMPORT_RE,
  listFiles,
  maskComments,
  registerScanCache,
  toRel,
  withNamedImport,
} from './shared.mjs'

const ACTIONS_DIR = ACTIONS_DIR_PATH

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

/**
 * 這個函式是不是「單純包裝那一支 action」。
 *
 * 這條要求名字對得上它打的那一支 api,前提是**那支 api 就是這個函式的全部** ——
 * 名字才說得出「這裡打的是哪一支」。函式在協調好幾件事時前提不成立:
 * 它的名字講的是那件事(使用者按了確認、進入畫面要準備什麼),
 * 改成 api 的名字反而更難懂 —— 讀的人會以為它只是那支 api 的包裝。
 *
 * 三個訊號,有一個成立就不是單純包裝:
 *
 *   等了第二件事      表單驗證、跳彈窗、另一支請求 —— 那支 action 只是其中一步
 *   還做了第二件事    同步呼叫另一個行為(記錄完再關掉、送出後再重置)
 *   那支被條件包住    有條件才打的一步(「已經有資料就不重打」),不是這個函式的全部
 *
 * 第二件事不一定會被 await —— 不回傳 Promise 的行為(關閉彈窗、重置狀態)
 * 直接呼叫就結束了。只認 await 的話,那種函式會被當成單純包裝,
 * 而它的名字講的是那件事,改成 api 的名字之後看的人會以為它只打了一支 api。
 *
 * 開關讀取狀態與錯誤處理不算第二件事(ACTION_UTILS)—— 那是包裝本來就要做的。
 *
 * 判斷前先把註解遮掉 —— 註解裡舉例寫出一個 await 或條件,不該影響判斷。
 */
const isPlainWrapper = (body, called) => {
  const text = maskComments('probe.js', body)

  if ([...text.matchAll(/\bawait\b/g)].length > 1) return false

  const behaviors = new Set(
    [...text.matchAll(/\b(on[A-Z]\w*)\s*\(/g)].map((m) => m[1]).filter((n) => !ACTION_UTILS.has(n))
  )

  if (behaviors.size > 1) return false

  const at = text.search(new RegExp(`\\b${called}\\s*\\(`))
  if (at === -1) return true

  let depth = 0
  for (let i = text.indexOf('{') + 1; i < at; i += 1) {
    if (text[i] === '{') depth += 1
    else if (text[i] === '}') depth -= 1
  }

  return depth === 0
}

const checkPageActionNaming = ({ rel, text }) => {
  // 元件也會包裝 action,不限頁面目錄
  if (!isInSrc(rel) || !rel.endsWith('.vue')) return []

  /* 先收齊這支檔案裡所有包裝 action 的函式,再一起判斷 ——
     「去掉 method 之後會不會與別支撞名」要看過整份檔案才知道。 */
  const wrappers = []

  for (const m of text.matchAll(ARROW_FN_RE)) {
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
    // 在協調好幾件事的函式,名字講的是那件事,不是它打的那一支 api
    if (!isPlainWrapper(body, called[0])) continue

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
  for (const group of byShort.values()) {
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

  /* 報的條件與自動修正動手的條件是同一個 —— 兩邊各判一次的話,
     會出現「規則報了、存檔卻沒有任何動靜」,而看的人不知道該怎麼辦:
     訊息說「存檔時會自動包好」,但它不會。 */
  const groups = wrappableGroupsOf(text, rel)
  if (!groups.length) return []

  const count = groups.reduce((sum, group) => sum + group.length, 0)
  const block = mountedBlockOf(text)

  return [
    issueOf(
      rel,
      lineNoOf(text, block.start),
      'pageAwaitAll',
      `onMounted 裡的 ${count} 支請求要用 ${PARALLEL_HELPER}([ … ]) 包起來 —— 一支一支等的話,使用者等的是每一支的時間加總;存檔時會自動包好`
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
/**
 * onMounted 裡「可以一起發出」的那幾組呼叫。
 *
 * **規則與自動修正共用這一份。** 兩邊各判一次的話,兩種方向都會出事:
 * 判得比自動修正寬,就會報一批存檔後沒有任何動靜的違規(訊息還說「會自動包好」);
 * 判得比它窄,則是自動改了一段規則根本沒報的程式碼。
 *
 * 三個條件同時成立才算:
 *
 *   整行就是 `await onApiXxx( … )`   沒有 await 就沒有在等待,包起來不會讓任何東西變快;
 *                                    接收回傳值的那種包進陣列之後就拿不到結果
 *   那幾行是連續的                   中間夾了別的語句代表有順序,跨過去合併會把安排打散
 *   後面那支沒有用到前面的東西       一起發出就是同時開始,誰先回來不一定
 */
const wrappableGroupsOf = (text, rel) => {
  if (!PARALLEL_HELPER || !isPageFile(rel)) return []

  const block = mountedBlockOf(text)
  if (!block) return []
  if (block.body.includes(`${PARALLEL_HELPER}(`)) return []

  const hits = []

  block.body.split('\n').forEach((line, i) => {
    const m = line.match(AWAIT_CALL_LINE_RE)
    if (m) hits.push({ index: i, indent: m[1], call: m[2].trim() })
  })

  const groups = []
  for (const hit of hits) {
    const last = groups.at(-1)
    if (last && hit.index === last.at(-1).index + 1) last.push(hit)
    else groups.push([hit])
  }

  return groups.filter((g) => canRunTogether(g.map((h) => h.call)))
}

export const onWrapMountedCalls = (text, rel) => {
  const usable = wrappableGroupsOf(text, rel)
  if (!usable.length) return null

  const block = mountedBlockOf(text)
  const lines = block.body.split('\n')
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
const withHelperImport = (text) => withNamedImport(text, PARALLEL_HELPER, PARALLEL_HELPER_SOURCE)

// --- 規則 popupLocation:彈窗收在頁面的元件層底下 ----------------------------
//
// 頁面目錄底下那幾層資料夾對應的是網址,而彈窗不是一個網址 —— 它是被某一頁
// 叫出來的東西。放在頁面那幾層裡的話,看目錄的人會以為多了一頁,
// 而路由表裡找不到它。
//
// 所以彈窗一律收在元件層底下(設定的 VIEW_UNDERSCORE_FOLDERS,通常是 _components)。
//
// **放在元件層的哪一層,看它被誰用**:只有某一個子單元用就收在那個子單元底下,
// 整個大單元共用才放在元件層的第一層。這一半沒有工具在檢查 —— 工具算得出
// 現在誰在用,看不出「以後會不會有第二個地方要用」。判斷方式寫在頁面規範裡。

const checkPopupLocation = ({ rel }) => {
  if (!POPUP_DIR_NAME) return [] // 這個專案沒有彈窗資料夾的慣例
  if (!rel.startsWith(`${VIEWS_DIR}/`) || !rel.endsWith('.vue')) return []

  const segments = rel.split('/')
  const at = segments.lastIndexOf(POPUP_DIR_NAME)
  if (at === -1) return []

  // 彈窗資料夾之前的那幾層裡,要有一層是元件層
  if (segments.slice(0, at).some((name) => VIEW_UNDERSCORE_FOLDERS.includes(name))) return []

  return [
    issueOf(
      rel,
      1,
      'popupLocation',
      `彈窗要收在頁面的元件層底下(${VIEW_UNDERSCORE_FOLDERS.join(' / ')})—— ` +
        `現在這個位置的每一層對應的都是網址,而彈窗不是一個網址;` +
        `看目錄的人會以為多了一頁,而路由表裡找不到它`
    ),
  ]
}

// --- 規則 breakpointOverride:頁面的 class 不要靠斷點去蓋掉基底 -------------
//
// `p-[15px] m:px-[20px]` —— 先給四邊 15px,再用手機那一段蓋掉左右。
// 畫面上是對的,但要知道手機的左右間距是多少,得先看基底寫了什麼、
// 再看哪一個斷點蓋了它、蓋的是哪幾邊。改一個值要同時想兩處,
// 而漏掉一處不會報錯 —— 只是某個斷點的間距悄悄變成另一個值。
//
// **該分斷點就每個斷點各寫一次**:`p:--px-15 m:--px-20`,一行看完。
//
// 只管頁面 —— 共用元件的 template 本來就不寫 utility class(規則 tailwind),
// 那一層由那條管。

/* 間距這一家有包含關係:短的蓋得住長的(p 蓋掉 px / py / pt…)。
   只比對同名的話,`p-[15px] m:px-[20px]` 這種最常見的寫法會被放行。 */
const UTILITY_COVERS = {
  p: ['px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe'],
  px: ['pl', 'pr', 'ps', 'pe'],
  py: ['pt', 'pb'],
  m: ['mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me'],
  mx: ['ml', 'mr', 'ms', 'me'],
  my: ['mt', 'mb'],
  gap: ['gap-x', 'gap-y'],
  border: ['border-x', 'border-y', 'border-t', 'border-r', 'border-b', 'border-l'],
  'border-x': ['border-l', 'border-r'],
  'border-y': ['border-t', 'border-b'],
  rounded: [
    'rounded-t',
    'rounded-r',
    'rounded-b',
    'rounded-l',
    'rounded-tl',
    'rounded-tr',
    'rounded-br',
    'rounded-bl',
  ],
  inset: ['top', 'right', 'bottom', 'left', 'inset-x', 'inset-y'],
  'inset-x': ['left', 'right'],
  'inset-y': ['top', 'bottom'],
}

const isCoveredBy = (base, scoped) =>
  base === scoped ||
  (UTILITY_COVERS[base] ?? []).includes(scoped) ||
  (UTILITY_COVERS[scoped] ?? []).includes(base)

/* 同一個 utility 前綴會產出兩種不同的 CSS 屬性 —— 它們不互相覆蓋。

   text-[--gray-6b]   color
   text-[18px]        font-size
   border-[--white]   border-color
   border-[2px]       border-width

   只看前綴的話,上面每一組都會被判成「同一個屬性被蓋掉」,
   而顏色與字級本來就該分開寫 —— 那是整批誤報。

   分辨的依據與 css-module-variables 那份規範裡「要標 length:」的判準是同一個:
   帶單位的數字與標了 length: 的是長度,變數與色碼是顏色。 */
const DUAL_TYPE_UTILITIES = new Set(['text', 'border', 'outline', 'ring', 'divide'])

/**
 * 去掉 class 前面那幾層前綴(`m:`、`hover:`),值原樣留著。
 *
 * **只切方括號之前的冒號** —— 值裡面也會有一個(`text-[length:--x]` 的型別提示)。
 * 連值一起切的話,那個 class 會被切成 `--x]`,認不出 utility 是什麼,
 * 於是標了型別的那些整批不被檢查 —— 而那正是規範要求的寫法。
 *
 * 判準只寫這一份,前綴與名稱兩處都用它。
 */
const withoutPrefixes = (token) => {
  const at = token.indexOf('[')
  const head = at === -1 ? token : token.slice(0, at)
  const cut = head.lastIndexOf(':')

  return cut === -1 ? token : token.slice(cut + 1)
}

const LENGTH_VALUE_RE = /^\[(?:length:|\d)/

const valueTypeOf = (token) => {
  const value = token.match(/(\[[^\]]*\])/)?.[1]

  // 不是方括號寫法(text-center、border-solid 那種)沒有型別之分
  if (!value) return ''

  return LENGTH_VALUE_RE.test(value) ? 'length' : 'color'
}

/**
 * 一個 class 的 utility 名字 —— 前綴與值都去掉。
 *
 * 同時有長度與顏色兩種版本的那幾個(text- / border- / …),名字後面接上型別 ——
 * 不接的話 text-[--紅色] 與 text-[18px] 會被當成同一個屬性。
 */
const utilityNameOf = (token) => {
  const noPrefix = withoutPrefixes(token)
  const m = noPrefix.match(/^(-?[a-z]+(?:-[a-z]+)*?)-(?:\[|\d|auto|full|px|screen)/)

  if (!m) return null

  const name = m[1]
  if (!DUAL_TYPE_UTILITIES.has(name)) return name

  const type = valueTypeOf(noPrefix)

  return type ? `${name}:${type}` : name
}

/**
 * 這個 class 掛在哪個斷點下。
 *
 * 回傳空字串代表沒有前綴(基底),null 代表前綴不是斷點
 * (`hover:`、`focus-within:` 那種狀態前綴不在這條的範圍內 ——
 * 那些本來就是「某個狀態下才蓋掉」,是它們的用途)。
 */
const breakpointOf = (token, prefixes) => {
  /* 「前綴到哪裡為止」取 withoutPrefixes 的那一份判準,不在這裡重算 ——
     值裡面也會有冒號(text-[length:--x] 的型別提示),兩處各算一次的話,
     其中一邊修好了另一邊還是舊的。 */
  const body = withoutPrefixes(token)
  if (body === token) return ''

  const prefix = token.slice(0, token.length - body.length - 1)

  return prefixes.has(prefix) ? prefix : null
}

const checkBreakpointOverride = ({ rel, text: raw }) => {
  if (!isPageFile(rel)) return []

  const prefixes = new Set(Object.values(BREAKPOINT_SCREENS).flat())
  if (!prefixes.size) return [] // 不做響應式的專案整條略過

  const text = maskComments(rel, raw)
  const issues = []

  for (const m of text.matchAll(/class="([^"]*)"/g)) {
    const base = new Map()
    const scoped = []

    for (const token of m[1].split(/\s+/).filter(Boolean)) {
      const at = breakpointOf(token, prefixes)
      if (at === null) continue

      const utility = utilityNameOf(token)
      if (!utility) continue

      if (at === '') base.set(utility, token)
      else scoped.push({ utility, token })
    }

    for (const one of scoped) {
      for (const [baseUtility, baseToken] of base) {
        if (!isCoveredBy(baseUtility, one.utility)) continue

        issues.push(
          issueOf(
            rel,
            lineNoOf(text, m.index),
            'breakpointOverride',
            `${baseToken} 被 ${one.token} 蓋掉 —— 每個斷點各寫一次,` +
              `不要先寫一個基底再用斷點覆蓋;` +
              `各斷點的值本來就相同的話,只留基底那一個就好(不必拆成每個斷點各一份)。` +
              `維持現在這樣的話,要知道某個斷點的實際值得先看基底、再找哪一段蓋了它,` +
              `而改動時漏掉一處不會報錯,只是那個斷點悄悄變成另一個值`
          )
        )
      }
    }
  }

  return issues
}

// --- 規則 popupId:彈窗的 id 要配對得起來 ------------------------------------
//
// 全站同一時間只有一個彈窗可見:每個實例拿自己的 id 與「現在開著的是誰」比對,
// 相同才顯示。所以宣告端寫的 id 與開啟時傳的 id 必須一模一樣。
//
// **對不上時沒有任何人會出聲。** 畫面不會報錯 —— 不認得的屬性框架就是靜靜
// 忽略(曾經有一支把 id 寫成別的字,那個彈窗從此打不開);建置不檢查;
// 程式的靜態檢查也管不到畫面區段裡的屬性名。要真的按下那個按鈕才會發現卡住。
//
// 三種對不上,分開報 —— 成因與要改的地方都不同:
//
//   宣告端沒寫 id            那個實例永遠不會顯示
//   開了一個沒人宣告的 id    按鈕按下去什麼都不會發生
//   宣告了卻沒有人會開它     多半是改名時漏掉一邊,或那支彈窗已經不用了
//
// 這條要看過整個原始碼才判斷得出來(宣告在元件、開啟在頁面),所以建一次索引。

let popupIdCache = null

registerScanCache(() => {
  popupIdCache = null
})

/** 畫面區段裡 `<標籤 … id="值">` 的那個值;動態綁定(`:id`)的算不出來,不收 */
const declaredIdsIn = (text, tags) => {
  const ids = []

  for (const tag of tags) {
    const re = new RegExp(`<${tag}\\b([^>]*)>`, 'g')

    for (const m of text.matchAll(re)) {
      const attrs = m[1]
      // 動態綁的值是變數,靜態算不出來 —— 那種跳過,不當成「沒寫 id」
      if (/\s:id\s*=/.test(attrs) || /\sv-bind:id\s*=/.test(attrs)) {
        ids.push({ id: null, dynamic: true, index: m.index })
        continue
      }

      const id = attrs.match(/\sid\s*=\s*"([^"]*)"/)?.[1]

      ids.push({ id: id ?? null, dynamic: false, index: m.index })
    }
  }

  return ids
}

/**
 * 開啟彈窗時傳的 id —— `onCustom({ id: 'xxx' })` 那個字面值,連同它在檔案裡的位置。
 *
 * **建索引與逐檔報違規都用這一支。** 兩邊各寫一次比對式的話,
 * 改了其中一邊(例如多認一種開啟函式)另一邊還是舊的 ——
 * 結果是索引裡有的 id,報違規那一輪卻認不出來,反過來也一樣。
 */
const openedIdsIn = (text) =>
  [...text.matchAll(/onCustom\s*\(\s*\{[^}]*?\bid\s*:\s*'([^']+)'/g)].map((m) => ({
    id: m[1],
    index: m.index,
  }))

const popupIdIndexOf = (root) => {
  if (popupIdCache?.root === root) return popupIdCache.index

  const declared = new Map() // id → 宣告它的檔案
  const opened = new Map() // id → 開啟它的檔案

  for (const dir of SCAN_TARGETS) {
    for (const abs of listFiles(root, dir)) {
      if (!abs.endsWith('.vue') && !abs.endsWith('.js')) continue

      const rel = toRel(root, abs)

      try {
        const text = maskComments(rel, fs.readFileSync(abs, 'utf8'))

        for (const one of declaredIdsIn(text, POPUP_TAGS)) {
          if (one.id) declared.set(one.id, rel)
        }
        for (const one of openedIdsIn(text)) opened.set(one.id, rel)
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  popupIdCache = { root, index: { declared, opened } }

  return popupIdCache.index
}

const checkPopupId = ({ rel, text: raw, root }) => {
  if (!POPUP_TAGS.length) return [] // 沒有彈窗元件的專案整條略過
  if (!isInSrc(rel) || !(rel.endsWith('.vue') || rel.endsWith('.js'))) return []

  const text = maskComments(rel, raw)
  const { declared, opened } = popupIdIndexOf(root)
  const issues = []

  /* 這支檔案的宣告只算一次 —— 下面兩種違規看的是同一批。
     各算一次的話,比對式改了其中一邊,兩種違規就開始用不同的判準。 */
  const declaredHere = declaredIdsIn(text, POPUP_TAGS)

  // 一、宣告端沒寫 id
  for (const one of declaredHere) {
    if (one.dynamic || one.id) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, one.index),
        'popupId',
        '彈窗沒有寫 id —— 每個實例靠 id 判斷自己要不要顯示,' +
          '沒有 id 的話它永遠不會出現,而且不會有任何錯誤訊息'
      )
    )
  }

  // 二、開了一個沒有人宣告的 id
  for (const one of openedIdsIn(text)) {
    if (declared.has(one.id)) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, one.index),
        'popupId',
        `開的是 '${one.id}',但全案沒有任何彈窗宣告這個 id —— ` +
          `按下去不會有任何反應,也不會報錯;` +
          `確認宣告端那一支的 id 有沒有拼錯、或改名時漏掉了一邊`
      )
    )
  }

  // 三、宣告了卻沒有人會開它
  for (const one of declaredHere) {
    if (!one.id || opened.has(one.id) || BUILTIN_POPUP_IDS.includes(one.id)) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, one.index),
        'popupId',
        `宣告了 '${one.id}',但全案沒有任何地方會開它 —— ` +
          `多半是改名時漏掉這一邊,或這支彈窗已經不用了(不用的話連同它的內容一起刪掉)`
      )
    )
  }

  return issues
}

export const PAGE_CHECKS = [
  checkPopupLocation,
  checkPageApiData,
  checkPageActionNaming,
  checkPageApiImport,
  checkPageAwaitAll,
  checkBreakpointOverride,
  checkPopupId,
]

export const PAGE_RULE_TITLE = {
  popupLocation: '彈窗放在對應網址的那幾層裡',
  pageApiData: '頁面自建 api 資料',
  pageActionNaming: '頁面包裝 action 的命名',
  pageApiImport: '頁面直接 import api',
  componentApiImport: '元件直接 import api',
  pageAwaitAll: '進入頁面時的請求沒有一起發出',
  breakpointOverride: '頁面的 class 靠斷點蓋掉基底',
  popupId: '彈窗的 id 對不起來',
}

export const PAGE_RULE_HINT = {
  popupLocation: `彈窗收在 ${VIEW_UNDERSCORE_FOLDERS.join(' / ')} 底下 —— 頁面那幾層對應的是網址`,
  pageApiData: 'api 資料放 store,頁面不要自己 ref 一份 —— 跳 popup / 換頁回來才不會消失',
  pageActionNaming: 'on + endpoint(去掉 Api 與 method)—— 三層命名一路對得上',
  pageApiImport: `api 走 ${ACTIONS_DIR} 進 store,頁面讀 store`,
  componentApiImport: '元件不去要資料 —— 由使用它的頁面傳進來,或頁面寫進 store 之後元件讀 store',
  pageAwaitAll: `onMounted 裡的請求用 ${PARALLEL_AWAIT_HELPER.name}([ … ]) 一起發出 —— 存檔時自動包好`,
  breakpointOverride: '每個斷點各寫一次,不要先寫一個基底再用斷點蓋掉它',
  popupId: '宣告端的 id 與開啟時傳的 id 要一模一樣 —— 對不上時不會報錯,彈窗就是打不開',
}
