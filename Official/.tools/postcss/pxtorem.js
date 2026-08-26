// 取代 postcss-pxtorem(最後發布於 2023)。
// 把宣告值裡的 px 換算成 rem;開啟 mediaQuery 時連 @media 的條件一起換。
//
// 三個看似小事、但影響產物正確性的細節,都與原版一致:
//   1. 引號字串 / url() / var() 內的 px 不能動 —— 用「先讓要跳過的東西被吃掉」的正規式技巧
//   2. 四捨五入不是 Number.toFixed,見 onToFixed 的說明
//   3. 同一條規則內若已有相同 prop 且值等於換算結果,不重複寫入
//
// 選項與原版同名:rootValue / unitPrecision / propList / selectorBlackList /
// replace / mediaQuery / minPixelValue / exclude / unit。舊版底線命名(root_value 等)未支援。

const DEFAULTS = {
  rootValue: 16,
  unitPrecision: 5,
  selectorBlackList: [],
  propList: ['font', 'font-size', 'line-height', 'letter-spacing'],
  replace: true,
  mediaQuery: false,
  minPixelValue: 0,
  exclude: null,
  unit: 'px',
}

// 「排除法」正規式:前四個分支專門吃掉不該轉換的內容,它們沒有捕獲組,
// 於是 replace 的 $1 是 undefined,回呼直接原樣返回;只有最後一段才真的捕獲數值。
// 少了這層,url(a-16px.png) 或 var(--x-16px) 裡的數字都會被誤換。
const onPixelRegex = (unit) =>
  new RegExp(`"[^"]+"|'[^']+'|url\\([^)]+\\)|var\\([^)]+\\)|(\\d*\\.?\\d+)${unit}`, 'g')

// ⚠️ 不可換成 Number.prototype.toFixed —— 它在 .5 的邊界採「就近偶數」,
//    這裡要的是「多算一位再進位」。兩者結果會在末位差一,產物就與舊版不一致了。
const onToFixed = (number, precision) => {
  const multiplier = 10 ** (precision + 1)
  const wholeNumber = Math.floor(number * multiplier)

  return (Math.round(wholeNumber / 10) * 10) / multiplier
}

const onPxReplace = (rootValue, unitPrecision, minPixelValue) => (whole, digits) => {
  if (!digits) return whole

  const pixels = parseFloat(digits)

  if (pixels < minPixelValue) return whole

  const fixed = onToFixed(pixels / rootValue, unitPrecision)

  return fixed === 0 ? '0' : `${fixed}rem`
}

// propList 的萬用字元語法(前面加 ! 為排除,四種形式都適用):
//   'font'    完全相符
//   'font*'   前綴相符
//   '*size'   後綴相符
//   '*line*'  包含
const onPropListMatcher = (propList) => {
  const hasWild = propList.includes('*')
  const matchAll = hasWild && propList.length === 1
  const collect = (test, cut) => propList.filter((item) => test.test(item)).map(cut)

  const lists = {
    exact: collect(/^[^*!]+$/, (item) => item),
    contain: collect(/^\*.+\*$/, (item) => item.slice(1, -1)),
    startWith: collect(/^[^*!]+\*$/, (item) => item.slice(0, -1)),
    endWith: collect(/^\*[^*]+$/, (item) => item.slice(1)),
    notExact: collect(/^![^*].*$/, (item) => item.slice(1)),
    notContain: collect(/^!\*.+\*$/, (item) => item.slice(2, -1)),
    notStartWith: collect(/^![^*]+\*$/, (item) => item.slice(1, -1)),
    notEndWith: collect(/^!\*[^*]+$/, (item) => item.slice(2)),
  }

  return (prop) => {
    if (matchAll) return true

    const included =
      hasWild ||
      lists.exact.includes(prop) ||
      lists.contain.some((item) => prop.includes(item)) ||
      lists.startWith.some((item) => prop.startsWith(item)) ||
      lists.endWith.some((item) => prop.endsWith(item))

    const excluded =
      lists.notExact.includes(prop) ||
      lists.notContain.some((item) => prop.includes(item)) ||
      lists.notStartWith.some((item) => prop.startsWith(item)) ||
      lists.notEndWith.some((item) => prop.endsWith(item))

    return included && !excluded
  }
}

const onBlacklistedSelector = (blacklist, selector) => {
  if (typeof selector !== 'string') return false

  return blacklist.some((item) => (typeof item === 'string' ? selector.includes(item) : item.test(selector)))
}

const onExcluded = (exclude, filePath) => {
  if (!exclude || !filePath) return false
  if (typeof exclude === 'function') return exclude(filePath)
  if (typeof exclude === 'string') return filePath.includes(exclude)

  return exclude.test(filePath)
}

// 同一條規則內已經有「同 prop 且值等於換算結果」的宣告時就別再寫一次,
// 避免 replace: false(保留 px 後綴一份 rem)模式下每次重跑都疊加一條。
const onDeclarationExists = (nodes, prop, value) =>
  nodes.some((node) => node.prop === prop && node.value === value)

const pxtorem = (options = {}) => {
  const opts = { ...DEFAULTS, ...options }
  const satisfyPropList = onPropListMatcher(opts.propList)

  let isExcludeFile = false
  let pxReplace = null

  return {
    postcssPlugin: 'inhouse-pxtorem',
    // rootValue 可為函式(依檔案決定基準值),故每份檔案進來時重建一次替換器
    Once(root) {
      const filePath = root.source?.input.file

      isExcludeFile = onExcluded(opts.exclude, filePath)

      const rootValue =
        typeof opts.rootValue === 'function' ? opts.rootValue(root.source.input) : opts.rootValue

      pxReplace = onPxReplace(rootValue, opts.unitPrecision, opts.minPixelValue)
    },
    Declaration(decl) {
      if (isExcludeFile || !pxReplace) return
      if (!decl.value.includes(opts.unit)) return
      if (!satisfyPropList(decl.prop)) return
      if (onBlacklistedSelector(opts.selectorBlackList, decl.parent?.selector)) return

      const value = decl.value.replace(onPixelRegex(opts.unit), pxReplace)

      if (onDeclarationExists(decl.parent.nodes, decl.prop, value)) return

      if (opts.replace) {
        decl.value = value
      } else {
        decl.cloneAfter({ value })
      }
    },
    AtRule(atRule) {
      if (isExcludeFile || !pxReplace) return
      if (!opts.mediaQuery || atRule.name !== 'media') return
      if (!atRule.params.includes(opts.unit)) return

      atRule.params = atRule.params.replace(onPixelRegex(opts.unit), pxReplace)
    },
  }
}

pxtorem.postcss = true

export default pxtorem
