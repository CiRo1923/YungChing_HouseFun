export const useProjectStore = defineStore('project', () => {
  // 伺服器時間(當下)。由 useProjectActions 的 onApiGetCommonServerTime() 更新 ——
  // 它第一次會真的打 API 取基準,之後都用「基準 + 經過的時間」推算,不再打。
  const serverTime = ref(null)
  // 那個基準:epoch 是後端給的時間、at 是取得當下的 performance.now()、
  // onServer 記錄是不是在 SSR 量的。
  //
  // 為什麼要記 onServer:performance.now() 的原點綁在該執行環境,
  // SSR 量到的基準隨 Pinia payload 帶到 client 之後對不上,client 要自己重取一次。
  const serverTimeBase = ref(null)
  // 全站 SEO 內容(目前用於 Header 的 H1);由各頁於取得資料時覆寫。
  const seo = ref({
    h1: '',
  })

  return {
    serverTime,
    serverTimeBase,
    seo,
  }
})
