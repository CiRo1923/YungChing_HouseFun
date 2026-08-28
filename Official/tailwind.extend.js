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
  // 顏色走色票變數(assets/css/_common/color.css)—— 這裡的值最後會變成產物裡的
  // box-shadow 宣告,所以規則 1「顏色一律定義在色票檔」對它一樣成立。
  boxShadow: {
    'black-y2-b4': '0 2px 4px var(--black-33)',
    dropdown: '-2px -2px 10px 0 var(--black-1a), 3px 4px 10px 0 var(--black-1a)',
    card: '0 0 5px 0 var(--black-26)',
  },
  letterSpacing: {
    default: '0.05rem',
  },
  lineHeight: {
    '1em': '1em',
  },
}
