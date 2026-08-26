// 取代 postcss-functions(停更於 2022)。
// 把宣告值裡「已註冊」的 fn(...) 交給 JS 求值,函式表由 postcss.function.js 提供。
//
//   --white-rgb: hexToRgb(#fff)   →   --white-rgb: 255, 255, 255
//
// 只比對註冊過的函式名,故 calc() / rgba() / var() 一律不受影響。

const functions = ({ functions: registry = {} } = {}) => {
  const names = Object.keys(registry)

  // 不含巢狀括號的呼叫即可涵蓋本專案用法
  const pattern = names.length ? new RegExp(`\\b(${names.join('|')})\\(([^()]*)\\)`, 'g') : null

  return {
    postcssPlugin: 'inhouse-functions',
    // 用 Declaration visitor 而非 Once:確保 tailwind / nesting 展開後產生的宣告也會被處理。
    Declaration(decl) {
      if (!pattern || !decl.value.includes('(')) return

      decl.value = decl.value.replace(pattern, (whole, name, args) => {
        const params = args
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '')
        const result = registry[name](...params)

        // 函式回傳 null / undefined(如 hexToRgb 收到非 hex)時原樣保留,不要印出 'null'。
        return result === null || result === undefined ? whole : String(result)
      })
    },
  }
}

functions.postcss = true

export default functions
