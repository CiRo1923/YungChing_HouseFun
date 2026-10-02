/* **這個專案自己的 tailwind 設定。**

  跟著元件走的那幾類(斷點、等比縮放的字級、偽元素的 content、成組的轉場屬性)
  在 tailwind.config.js —— 換一個專案也是同一份,改了元件就會長得不一樣。

  這一支放「每個站不同」的:字體是其中一個,其餘由這個專案自己決定要不要加。

  **兩種寫法差很多:**

    直接寫在下面第一層   整組覆寫 —— 那一類的內建值全部消失
    寫在 extend 底下     補充 —— 內建的都還在,自己加的是多出來的

  整組覆寫之後,再寫那些內建的名字(text-lg、sm: 這種)不會報錯,
  但產不出任何 CSS。規則 `theme` 會擋下那種寫法。

  **extend 底下的自訂沒有任何規則在守。** 名字打錯了不會有人發現,
  而看起來像打錯的名字(transition-opacitys)可能正是設定裡定義的。
  要判斷一個 class 存不存在,這一支與 tailwind.config.js 兩邊都要看。

  **陰影不要放這裡。** 值裡會帶色碼,而這支檔案不在規範檢查的掃描範圍內,
  寫死了也不會被抓到。陰影一律走原生 box-shadow 加模組自己的 --x-*-shadow 變數,
  色值取色票變數。 */

export default {
  /* 整組覆寫 —— font-sans / font-serif / font-mono 都不存在,只有 font-default。
    字體是全站一致的東西,留著內建的那幾個只會讓人以為可以選。

    換一個站就換一份字體清單,所以放在這裡而不是跟著元件走的那一支。 */
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

  // 只有這個站要的東西加在這裡,內建的值都還在
  extend: {},
}
