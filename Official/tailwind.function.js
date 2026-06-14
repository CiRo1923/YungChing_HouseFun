export default {
  onSetWidth() {
    const onReturnWidth = (value) => {
      const result = {}
      for (let i = 1; i <= value; i += 1) {
        result[`${i}/${value}`] = `${(i / value) * 100}%`
      }
      return result
    }

    return {
      ...onReturnWidth(7),
      ...onReturnWidth(8),
      ...onReturnWidth(9),
      ...onReturnWidth(10),
      ...onReturnWidth(11),
    }
  },
  onColorWithAlpha(value) {
    const parseColorAlpha = (input) => {
      const cssVarMatch = input.match(/^var\((--[^,\s]+),\s*([^)]+)\)$/)

      if (cssVarMatch) {
        return [`var(${cssVarMatch[1]})`, cssVarMatch[2]]
      }

      const alphaMatch = input.match(/^(.*),\s*(\d*\.?\d+)$/)

      if (alphaMatch) {
        return [alphaMatch[1], alphaMatch[2]]
      }

      return [input, '1']
    }

    const [rawColor, rawAlpha = '1'] = parseColorAlpha(value)
    const alpha = Math.round(Number(rawAlpha) * 255)
      .toString(16)
      .padStart(2, '0')

    // #000,0.5 => #00000080
    if (rawColor.startsWith('#')) {
      let hex = rawColor.slice(1)

      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((x) => x + x)
          .join('')
      }

      return `#${hex}${alpha}`
    }

    // var(--black),0.5
    if (rawColor.startsWith('var(')) {
      return `color-mix(in srgb, ${rawColor} ${Number(rawAlpha) * 100}%, transparent)`
    }

    // --black,0.5
    if (rawColor.startsWith('--')) {
      return `color-mix(in srgb, var(${rawColor}) ${Number(rawAlpha) * 100}%, transparent)`
    }

    return rawColor
  },
}
