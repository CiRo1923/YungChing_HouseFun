import CKEditor from '@mayasabha/ckeditor4-vue3'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(CKEditor)
})
