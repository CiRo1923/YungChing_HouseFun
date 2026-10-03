/** @type {import('tailwindcss').Config} */

/* tailwind 的設定入口 —— 掃哪些檔案、掛哪些外掛,以及**跟著元件走的那幾類值**。

  這一支放「換一個專案也一樣」的東西:斷點、等比縮放的字級、
  偽元素的 content、成組的轉場屬性 —— 元件的樣式直接用那些名字,
  改了元件就會長得不一樣。

  值來自 config.js 的那幾個(手機的寬度上限、桌機的基準寬度)也寫在這裡,
  因為這支設定檔本來就要讀那一支 —— 轉一手到別的檔案只是多一層。

  **每個站不同的那幾類在 tailwind.theme.js**(字體、這個站自己要加的東西),
  「設定檔用到的產生器」在 tailwind.function.js。三支的檔名固定。 */

import CONFIG from './config.js'
import plugin from 'tailwindcss/plugin'
import theme from './tailwind.theme.js'
import { onSetWidth } from './tailwind.function.js'

export default {
  corePlugins: {
    // tailwind 內建的 reset(preflight)要不要開 —— 哪一種、為什麼,見 config.js 那一項
    preflight: CONFIG.useTailwindCssReset,
  },
  content: [
    './components/**/*.{js,vue,ts}',
    './containers/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './static/**/*.{js,json,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    ...theme,

    /* 斷點與正式專案逐字一致 —— 元件 CSS 直接寫 @screen p / t / m,
    這裡的定義一改,元件在驗證環境與正式站的表現就會不一樣。

    整組覆寫,所以 tailwind 內建的 sm / md / lg / xl 都不存在。 */
    screens: {
      notsupport: {
        raw:
          CONFIG.ieVersion === 0
            ? String.raw`screen and (min-width: 0\0)`
            : String.raw`\0screen\, screen\9, all and (min-width: 0\0) and (min-resolution: 0.001dpcm)`,
      },
      mLandscape: {
        raw: `(max-width: ${
          CONFIG.mobileMaxWidth - 1
        }px) and (orientation: landscape) and (min-width: 480px),
        (max-width: 999px) and (max-height: 428px) and (orientation: landscape) and (orientation: landscape) and (min-width: 480px)`,
      },
      m: {
        raw: `(max-width: 999px) and (max-height: 428px) and (orientation: landscape), (max-width: ${
          CONFIG.mobileMaxWidth - 1
        }px)`,
      },
      /* 第三條是補縫用的。

      前兩條之間漏掉一段:`m` 的橫向那一條上限是 999(手機橫放不會比那更寬),
      而這裡的第一條要求高度至少 428 —— 於是**寬 1000 到 1023、而且高度不足 428**
      的視窗三個斷點都不命中,那時所有跟著斷點指派的變數都讀不到值,
      整條宣告被瀏覽器丟掉,而且不報錯。

      那個尺寸是把桌機視窗拉成很扁的一條,不是任何裝置的解析度 ——
      所以補在這裡(當成平板)而不是補進 `m`:寬度已經超過手機橫放的上限了。

      範圍寫死 1000 到 1023 而不是放寬既有的條件,是為了只補那一段:
      動到 `min-height` 的話,大螢幕手機橫放與桌機扁視窗的判定會跟著變。 */
      t: {
        raw: `(min-width: ${CONFIG.mobileMaxWidth}px) and (max-width: 1024px) and (min-height: 428px),(min-width: 1024px) and (max-height: 1366px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 1.5),(min-width: 1000px) and (max-width: 1023px)`,
      },
      tm: {
        raw: '(max-width: 1024px), (min-width: 1024px) and (max-height: 1366px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 1.5)',
      },
      /* 第二條與 `t` 的第三條是同一件事 —— 寬 1000 到 1023、高度不足 428 的視窗,
      前一條的 `min-height` 會把它排除掉。兩邊都要補,
      不然那個尺寸會變成「算平板但不算桌機加平板」,而那說不出道理。 */
      pt: {
        raw: `(min-width: ${CONFIG.mobileMaxWidth}px) and (min-height: 428px),(min-width: 1000px) and (max-width: 1023px)`,
      },
      pMin: {
        min: '1024px',
        max: `${CONFIG.desktopMinWidth}px`,
      },
      p: {
        raw: '(min-width: 1024px)',
      },
      pMax: {
        min: `${CONFIG.desktopMinWidth + 1}px`,
      },
      firefox: {
        raw: '(min--moz-device-pixel-ratio:0) and (display-mode:browser), (min--moz-device-pixel-ratio:0) and (display-mode:fullscreen)',
      },
      IE: {
        raw: 'screen and (-ms-high-contrast:active), (-ms-high-contrast:none)',
      },
    },

    /* 整組覆寫 —— text-sm / text-base 那些內建的字級都不存在。
      要寫死尺寸時用 text-[14px] 這種,要分斷點時定義成 css 變數
      (見 css-module-variables 那份規範)。

      這裡留的四個是「跟著視窗寬度縮放」的字級,給整頁等比縮放的版面用。 */
    fontSize: {
      vmp: `${(16 / CONFIG.desktopMinWidth) * 100}vw`,
      vmt: `${(16 / 768) * 100}vw`,
      vmm: `${(16 / CONFIG.basicMobileWidth) * 100}vw`,
      vmmls: `${((16 / CONFIG.basicMobileWidth) * 100) / 1.77}vw`,
    },

    /* 以下是補充,內建的值都還在。

      這幾項元件的樣式直接在用,所以跟著元件走 ——
      拿掉的話那幾支樣式會靜靜地失效(偽元素不顯示、轉場只做一半)。 */
    extend: {
      ...theme.extend,

      // 七到十一等分的寬度(日曆是七格)—— 內建只有二到六等分
      width: onSetWidth(),

      // 偽元素要顯示時 content 不能是空的,給一個空字串的預設值
      content: {
        default: "''",
      },

      /* 內建的 transition-* 只認單一屬性,這幾個是成組的:
        opacitys 同時過渡 opacity 與 visibility —— 切換可見性的淡入淡出要用它,
        只寫 transition-opacity 的話元素會在淡出還沒完成時就直接消失。 */
      transitionProperty: {
        widths: 'width, max-width, min-width',
        heights: 'height, max-height, min-height',
        opacitys: 'opacity, visibility',
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        // 輸入法在這個欄位不要跳出來(電話、數字那類欄位)
        '.imeMode-disabled': { 'ime-mode': 'disabled' },
      })
    }),
  ],
}
