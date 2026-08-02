import * as prototype from '@js/_prototype.js'

export default () => {
  const common = useCommonStore()
  const project = useProjectStore()
  const { isLoading, device } = storeToRefs(common)

  // 各頁於取得資料時覆寫全站 SEO(目前驅動 Header 的 H1),保留預設鍵避免缺值。
  const onSetSeo = (seo = {}) => {
    project.seo = { h1: '', ...seo }
  }
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
  const onCanonicalHref = (url) => {
    // 規格:網址結尾需以 `/` 結束(在 pathname 尾端補斜線,保留 query / hash)
    const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`

    return `${url.origin}${pathname}${url.search}${url.hash}`
  }

  const onUseMeta = (meta = {}) => {
    const { url } = meta
    // API 沒回 canonical 時的 fallback:由當前網址補結尾斜線。
    const fallbackHref = url ? onCanonicalHref(url) : undefined

    useHead(() => {
      // 頁面顯式傳入的 meta 覆蓋全站 project.seo,相容未走 onSetSeo 的頁面(如會員頁)舊用法。
      const seo = { ...project.seo, ...meta }
      // og:image 尺寸佔位:與 nuxt.config 的 og:image:width/height(1200 / 630)對齊。
      const ogImage = seo.ogImage
        ? seo.ogImage.replaceAll('{0}', '1200').replaceAll('{1}', '630')
        : undefined
      // canonical / og:url 優先綁 API 的 seo.canonical;相對路徑補上 origin 成絕對網址,
      // 已是絕對網址則原樣使用;API 沒給才退回「當前網址補斜線」。
      const canonical = seo.canonical
        ? /^https?:\/\//.test(seo.canonical)
          ? seo.canonical
          : `${url?.origin ?? ''}${seo.canonical}`
        : fallbackHref

      return {
        title: seo.title,
        meta: [
          { name: 'description', itemprop: 'description', content: seo.description },
          { property: 'og:title', itemprop: 'name', content: seo.ogTitle ?? seo.title },
          { property: 'og:description', content: seo.ogDescription ?? seo.description },
          { property: 'og:image', content: ogImage },
          { property: 'og:url', itemprop: 'url', content: canonical },
          // robots 一律輸出;API 有給用其值(可為 noindex),沒給則預設 index, follow
          { name: 'robots', content: seo.robots ?? 'index, follow' },
        ].filter((item) => item.content),
        link: canonical ? [{ rel: 'canonical', href: canonical }] : [],
        script: seo.jsonLd
          ? [
              {
                type: 'application/ld+json',
                // 轉義 `<` 避免案名等內容夾帶 `</script>` 破壞標籤。
                innerHTML: JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c'),
              },
            ]
          : [],
      }
    })
  }

  const onIsLoading = (boolean) => {
    isLoading.value = boolean
  }

  const onResize = () => {
    device.value = onDevice()
  }

  const onWithLoadingAll = async (promises) => {
    if (import.meta.client) {
      onIsLoading(true)
    }

    try {
      return await Promise.all(promises)
    } finally {
      if (import.meta.client) {
        onIsLoading(false)
      }
    }
  }

  const onReset = () => {
    onIsLoading(false)
  }

  return {
    onDevice,
    onUseMeta,
    onSetSeo,
    onIsLoading,
    onResize,
    onWithLoadingAll,
    onReset,
  }
}
