module.exports = {
  port: 25111,
  https: true,
  ieVersion: 11,
  desktopMinWidth: 1366,
  mobileMaxWidth: 740,
  basicMobileWidth: 375,
  css: 'assets/css',
  imgs: 'assets/img',
  fonts: '',
  js: 'scripts',
  svg: '_svg',
  proxy: {
    '/api': {
      target: process.env.VITE_API_PATH,
      changeOrigin: true
    }
  }
}
