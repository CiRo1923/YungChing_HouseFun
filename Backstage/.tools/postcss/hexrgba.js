// 取代 postcss-hexrgba(停更於 2022)。
// 讓 rgba() 可以直接吃 hex,省去手動換算。
//
//   box-shadow: 0 3px 5px rgba(#000, 0.1)   →   rgba(0, 0, 0, 0.1)

const HEX_SHORT = /^#([\da-f])([\da-f])([\da-f])$/i
const HEX_FULL = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i

const onHexToRgb = (hex) => {
  const short = hex.match(HEX_SHORT)
  const full = hex.match(HEX_FULL)
  const parts = short ? short.slice(1).map((char) => `${char}${char}`) : full ? full.slice(1) : null

  return parts ? parts.map((part) => parseInt(part, 16)) : null
}

const hexrgba = () => ({
  postcssPlugin: 'inhouse-hexrgba',
  // 與 functions 一致採 Declaration visitor,確保迴圈展開後產生的宣告也會被處理。
  Declaration(decl) {
    if (!/rgba\(\s*#/i.test(decl.value)) return

    decl.value = decl.value.replace(
      /rgba\(\s*(#[\da-f]{3}|#[\da-f]{6})\s*,\s*([^)]+?)\s*\)/gi,
      (whole, hex, alpha) => {
        const rgb = onHexToRgb(hex)

        return rgb ? `rgba(${rgb.join(', ')}, ${alpha})` : whole
      }
    )
  },
})

hexrgba.postcss = true

export default hexrgba
