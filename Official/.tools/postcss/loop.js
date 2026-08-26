// 取代 postcss-each + postcss-for(皆停更於 2022,for 還在用 PostCSS 7 的 postcss.plugin() API)。
// 兩者只差在「參數怎麼解析成清單」,展開機制完全共用,故合併為一支。
//
//   @each $value in a, b, c   →  依序展開,$(value) / $value 換成項目
//   @for $i from 1 to 10      →  展開 1..10,頭尾皆含
//
// var(--x) 形式的來源清單請先經 eachVariables 解析成字面清單。

// 各種迴圈 at-rule 的參數解析:回傳 { name, items },不合語法回傳 null。
// 要新增迴圈語法,在這裡加一個 key 即可。
const LOOP_PARSERS = {
  each(params) {
    const matched = params.match(/^\$(\w+)\s+in\s+([\s\S]+)$/)

    if (!matched) return null

    return {
      name: matched[1],
      items: matched[2]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }
  },

  for(params) {
    const matched = params.match(/^\$(\w+)\s+from\s+(-?\d+)\s+to\s+(-?\d+)$/)

    if (!matched) return null

    const from = Number(matched[2])
    const to = Number(matched[3])
    const step = from <= to ? 1 : -1
    const items = []

    for (let i = from; step > 0 ? i <= to : i >= to; i += step) items.push(String(i))

    return { name: matched[1], items }
  },
}

// 兩種插值形式都要支援(與 postcss-each 一致):
//   $(value)  括號形式,可安全接在其他字元後面,如 .\=text-$(value)
//   $value    裸形式
// 先換括號形式,再換裸形式,避免裸形式規則誤傷 $(value)。
const onReplaceToken = (text, name, value) => {
  if (!text.includes('$')) return text

  return text
    .split(`$(${name})`)
    .join(value)
    .replace(new RegExp(`\\$${name}\\b`, 'g'), value)
}

// 遞迴替換節點(含子樹)的選擇器、宣告 prop/value、巢狀 at-rule 參數。
const onSubstitute = (node, name, value) => {
  if (node.type === 'rule') node.selector = onReplaceToken(node.selector, name, value)
  if (node.type === 'atrule') node.params = onReplaceToken(node.params, name, value)
  if (node.type === 'decl') {
    node.prop = onReplaceToken(node.prop, name, value)
    node.value = onReplaceToken(node.value, name, value)
  }

  if (node.nodes) {
    for (const child of node.nodes) onSubstitute(child, name, value)
  }
}

// 將 at-rule 展開成「每個項目一份子節點複本」。
const onExpand = (atRule, name, items) => {
  const generated = []

  for (const item of items) {
    for (const child of atRule.nodes || []) {
      const clone = child.clone()

      onSubstitute(clone, name, item)
      generated.push(clone)
    }
  }

  atRule.replaceWith(generated)
}

// ⚠️ 必須用 AtRule visitor(走訪階段),不能用 Once(前置階段)。
//    舊 postcss-each 就是 visitor,展開時機在 nesting 之後;若改用 Once 提前展開,
//    nesting 會看到已展開的巢狀規則並自行展平,產生
//      :is(.editor .a,.editor .b)::after   而非   .editor :is(.a,.b)::after
//    兩者語意與特異性相等,但為了與舊版產物一致,維持相同時機。
//    另外 visitor 會自動走訪新插入的節點,巢狀的 @each / @for 不必自己再跑一輪。
const onVisit = (atRule) => {
  const parsed = LOOP_PARSERS[atRule.name](atRule.params)

  if (!parsed) {
    throw atRule.error(`無法解析 @${atRule.name} 的參數:${atRule.params}`, {
      plugin: 'inhouse-loop',
    })
  }

  onExpand(atRule, parsed.name, parsed.items)
}

const loop = () => ({
  postcssPlugin: 'inhouse-loop',
  AtRule: {
    each: onVisit,
    for: onVisit,
  },
})

loop.postcss = true

export default loop
