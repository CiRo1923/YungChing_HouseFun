import { defineStore } from 'pinia'

export const useProjectStore = defineStore('project', () => {
  const serverTime = ref(null)
  // 全站 SEO 內容(目前用於 Header 的 H1);由各頁於取得資料時覆寫。
  const seo = ref({ h1: '' })

  return {
    serverTime,
    seo,
  }
})
