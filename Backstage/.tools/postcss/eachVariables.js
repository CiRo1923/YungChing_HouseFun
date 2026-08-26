// 取代 postcss-each-variables(停更於 2022,且仍使用 PostCSS 7 的 postcss.plugin() API,build 會噴棄用警告)。
//
// 把 @each 的「清單來源變數」解析成字面清單,實際展開交給 loop。支援兩種來源:
//
//   ① CSS 變數(會出貨)—— 值要用括號包起來
//      :root { --colors: (#fff, #000); }
//      @each $value in var(--colors) { … }   →   @each $value in #fff, #000 { … }
//
//   ② 建置期變數(不出貨)—— 括號可有可無
//      $font-size: 20, 16, 15, 14;
//      @each $size in $font-size { … }
//
// 兩者的差別不只在寫法,選用時要清楚:
//
//   | | 宣告會不會留在產物 | 順序 |
//   | ① var() | **會**(它是真的 CSS 變數,可能有別處在用) | 純整數清單被升冪(見下方 legacy 說明) |
//   | ② $name | **不會**(展開後宣告即移除) | 維持原始碼順序 |
//
// ⚠️ ② 沒有作用域概念 —— postcss-import 合併後整份 CSS 共用一個表,
//    定義在哪個檔案都看得到。同名重複定義時後者覆蓋前者,且不會警告。

// 把 `(a, b, c)` 解析成 ['a','b','c'];允許換行與尾逗號。
const onParseList = (value) => {
  const matched = String(value)
    .trim()
    .match(/^\(([\s\S]*)\)$/)

  if (!matched) return null

  return onSplitList(matched[1])
}

// 逗號分隔的清單,括號可有可無(給 $name 用)。
const onParseLooseList = (value) => {
  const text = String(value).trim()
  const inner = text.match(/^\(([\s\S]*)\)$/)

  return onSplitList(inner ? inner[1] : text)
}

const onSplitList = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// ⚠️ 刻意重現舊 postcss-each-variables 的排序行為,讓產物與舊版位元組完全一致。
// 舊版把清單「以值當物件 key」保存,而 JS 物件的整數 key 會被引擎排到最前面並升冪輸出:
//   --border: (4, 3, 1)      → 1, 3, 4      純整數 → 升冪
//   --leading: (1.5, 1.2)    → 原順序        非整數 → 維持插入順序
//   --position: (absolute, …) → 原順序       字串 → 維持插入順序
// 這些選擇器彼此獨立(同一元素不會同時掛 .=border-1 與 .=border-4),順序不影響外觀;
// 若日後想改回「原始碼順序」,把這支拿掉、直接回傳 items 即可。
const onOrderLikeLegacy = (items) => {
  const isIndexKey = (item) => /^(0|[1-9]\d*)$/.test(item) && Number(item) < 2 ** 32 - 1

  return [
    ...items.filter(isIndexKey).sort((a, b) => Number(a) - Number(b)),
    ...items.filter((item) => !isIndexKey(item)),
  ]
}

const eachVariables = () => ({
  postcssPlugin: 'inhouse-each-variables',
  Once(root) {
    // ① CSS 變數:值必須是 `(…)`,宣告保留
    const cssLists = new Map()

    root.walkDecls(/^--/, (decl) => {
      const items = onParseList(decl.value)

      if (items) cssLists.set(decl.prop, onOrderLikeLegacy(items))
    })

    // ② 建置期變數:宣告移除,不出貨
    const buildLists = new Map()
    const emptied = new Set()

    root.walkDecls(/^\$/, (decl) => {
      buildLists.set(decl.prop, onParseLooseList(decl.value))

      // 寫在 rule 內時,移掉宣告可能讓該 rule 變成空殼,一起收掉
      const parent = decl.parent

      decl.remove()

      if (parent && parent.type === 'rule' && !parent.nodes.length) emptied.add(parent)
    })

    for (const rule of emptied) rule.remove()

    // ⚠️ 不要因為「兩個表都空」就提早 return —— 那會讓 `@each $v in $nope`
    //    完全不受檢查,接著被 loop 當成「只有一個項目、值是字面 `$nope`」展開一次,
    //    產出一條選擇器裡帶著 `$nope` 的垃圾規則,且沒有任何錯誤訊息。
    root.walkAtRules('each', (atRule) => {
      // `@each $item in var(--list)` 或 `@each $item in $list`
      const matched = atRule.params.match(
        /^(\$[\w-]+\s+in\s+)(?:var\(\s*(--[\w-]+)\s*\)|(\$[\w-]+))$/
      )

      if (!matched) return

      const [, prefix, cssName, buildName] = matched
      const name = cssName || buildName
      const items = cssName ? cssLists.get(cssName) : buildLists.get(buildName)

      if (!items) {
        throw atRule.error(`找不到清單變數 ${name}`, { plugin: 'inhouse-each-variables' })
      }

      atRule.params = `${prefix}${items.join(', ')}`
    })
  },
})

eachVariables.postcss = true

export default eachVariables
