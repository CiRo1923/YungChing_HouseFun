module.exports = {
  // Nitro 用日期決定要套用哪一組預設行為,填的是本專案驗證過的基準日。
  // 不填的話會退回內建的基準日,並在每次啟動印出 NUXT_B5001 警告。
  // 這一項每個專案不一樣:複製這份設定到新專案時要換成當天的日期。
  // 沿用別的專案的日期不會報錯,那個專案會安靜地停在別人的基準上。
  compatibilityDate: '2026-09-21',
  port: 26021,
  https: true,
  ieVersion: 11,
  desktopMinWidth: 1366,
  mobileMaxWidth: 740,
  basicMobileWidth: 375,
  css: 'assets/css',
  imgs: 'assets/imgs',
  fonts: '',
  js: 'scripts',
  svg: '_svg',
  proxy: {
    '/api': {
      target: process.env.NUXT_PUBLIC_API_PATH,
      changeOrigin: true,
      secure: false,
    },
  },
}
