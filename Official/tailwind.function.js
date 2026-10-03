/* tailwind.theme.js 用到的產生器 —— 與正式專案同一份。 */

// 七、八、九、十、十一等分的寬度(日曆是七格)
export const onSetWidth = () => {
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
}
