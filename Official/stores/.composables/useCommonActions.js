import * as prototype from '@js/_prototype.js'

const useCommonActions = () => {
  const common = useCommonStore()
  const { isLoading, device } = storeToRefs(common)
  const onDevice = () => {
    const onServer = () => {
      const headers = useRequestHeaders()
      const userAgent = headers['user-agent'] || ''

      const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isPad =
        /iPad/i.test(userAgent) ||
        (/Mac OS X/i.test(userAgent) && /Mobile/i.test(userAgent)) ||
        (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))

      if (isMobile) return 'm'
      if (isPad) return 't'

      return 'p'
    }

    if (import.meta.server) return onServer()
    if (import.meta.client) return prototype.onDevice()
  }
  /* SEO 那一組(寫 head 的 meta、canonical、og、結構化資料)不放在這裡,
    放各專案自己的那一支行為(useProjectActions)。

    那幾件事每個站的規格都不一樣:canonical 要不要補結尾斜線、
    og 的圖片尺寸怎麼取、robots 的預設值、要不要吐結構化資料 ——
    而且它們讀的是專案自己的狀態(站台設定、當前頁的資料)。

    放在這一支共用的行為裡,每個專案拿到的是同一套輸出,要改就得動這支檔案 ——
    而它是整套覆蓋的對象:改完下一次更新就消失,而消失的當下沒有訊息,
    只是搜尋引擎看到的東西變回別人的設定。 */

  const onIsLoading = (boolean) => {
    isLoading.value = boolean
  }

  const onResize = () => {
    device.value = onDevice()
  }

  return {
    onDevice,
    onIsLoading,
    onResize,
  }
}

export default useCommonActions
