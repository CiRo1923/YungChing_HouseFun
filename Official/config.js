export default {
  port: 26031,
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
    '/memberAuth/api': {
      target: process.env.NUXT_PUBLIC_MEMBER_API_PATH,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/memberAuth/, ''),
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
