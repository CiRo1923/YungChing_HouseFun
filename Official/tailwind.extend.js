export default {
  fontFamily: {
    default: [
      'Noto Sans TC',
      '微軟正黑體',
      'Microsoft JhengHei',
      'Heiti TC',
      '黑體',
      'Arial',
      'Helvetica',
      'sans-serif',
    ],
  },
  // 這裡不要放陰影 —— 值裡會帶色碼,而這支檔案雖然在 lint 的設定檔白名單裡,
  // preset 本身仍是「藏在 js 裡的樣式」:改一個陰影要跨到設定檔、還無法分斷點。
  // 陰影一律走原生 box-shadow + module 自己的 --x-*-shadow 變數(參考 mSort / mTab),
  // 色值取色票變數;module 以外(containers / pages)寫 shadow-[0_2px_4px_var(--black-33)]
  // 這種帶完整值的 arbitrary value —— 實測產出正確的 box-shadow,不會被當成陰影顏色。
  letterSpacing: {
    default: '0.05rem',
  },
  lineHeight: {
    '1em': '1em',
  },
}
