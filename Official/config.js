export default {
  // Nitro 用日期決定要套用哪一組預設行為,填的是本專案驗證過的基準日。
  // 不填的話會退回內建的基準日,並在每次啟動印出 NUXT_B5001 警告。
  // 這一項每個專案不一樣:複製這份設定到新專案時要換成當天的日期。
  // 沿用別的專案的日期不會報錯,那個專案會安靜地停在別人的基準上。
  compatibilityDate: '2026-08-27',
  port: 26031,
  https: true,
  ieVersion: 11,

  /* 用 tailwind 內建的那一份 reset(它叫 preflight)。

     true    用 tailwind 的,跟著版本更新
     false   關掉它,改走 assets/css/_common/reset.css ——
             那一份是內建的抄本,可以照這個專案的需要改;
             nuxt.config.ts 的 css 清單跟著這個設定載入它 */
  useTailwindCssReset: true,
  desktopMinWidth: 1366,
  mobileMaxWidth: 740,
  basicMobileWidth: 375,
  css: 'assets/css',
  imgs: 'assets/imgs',
  fonts: '',
  js: 'scripts',
  svg: '_svg',
  proxy: {
    '/memberAuth/api': {
      target: process.env.NUXT_PUBLIC_MEMBER_AUTH_API_PATH,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/memberAuth/, ''),
    },
    '/member/api': {
      target: process.env.NUXT_PUBLIC_MEMBER_API_PATH,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/member/, ''),
    },
    '/buy/api': {
      target: process.env.NUXT_PUBLIC_BUY_API_PATH,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/buy/, ''),
    },
    '/manage/api': {
      target: process.env.NUXT_PUBLIC_MANAGE_API_PATH,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/manage/, ''),
    },
  },
}
