import mSvgIcon from '@components/common/mSvgIcon/Index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('mSvgIcon', mSvgIcon)
})
