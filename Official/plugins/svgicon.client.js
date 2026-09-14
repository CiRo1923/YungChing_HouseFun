import mSvgIcon from '@components/common/mSvgIcon.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('mSvgIcon', mSvgIcon)
})
