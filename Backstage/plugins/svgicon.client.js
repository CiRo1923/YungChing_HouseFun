import SvgIcon from '@components/common/SvgIcon.vue'

import 'virtual:svg-icons-register'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('SvgIcon', SvgIcon)
})
