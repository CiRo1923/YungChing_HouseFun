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
  // 這裡不要放陰影 —— 值裡會帶色碼,而這支檔案不在 lint 的掃描範圍內,寫死了也不會被抓到。
  // 陰影一律走原生 box-shadow + module 自己的 --x-*-shadow 變數(參考 mFormDropdown / mSort),
  // 色值取色票變數。boxShadow.dropdown 與 dropShadow.text 都是這樣移除的。
  // letterSpacing: {
  //   default: '0.1em',
  // },
}
