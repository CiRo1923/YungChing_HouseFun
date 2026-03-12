import SvgIcon from '@components/common/SvgIcon.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('SvgIcon', SvgIcon)
})
