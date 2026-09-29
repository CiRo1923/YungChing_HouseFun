import { apiGetCommonServerTime } from '@js/_api/manage.js'

import { onFormatDate } from '@js/_prototype.js'

export default () => {
  const project = useProjectStore()
  const { serverTime, serverTimeBase } = storeToRefs(project)
  const { onApiError } = usePopupActions()

  const onFormatServerTime = (date) => ({
    value: onFormatDate(date, 'YYYY-MM-DD'),
    full: onFormatDate(date, 'YYYY-MM-DD hh:mm:ss'),
    year: onFormatDate(date, 'YYYY'),
    month: onFormatDate(date, 'MM'),
    day: onFormatDate(date, 'DD'),
    hours: onFormatDate(date, 'hh'),
    minute: onFormatDate(date, 'mm'),
    second: onFormatDate(date, 'ss'),
  })

  // 呼叫端的用法不變:await 這支之後,serverTime 就是「當下」的伺服器時間。
  // 差別在它只會真的打一次 API —— 之後都用基準 + 經過的時間推算。
  //
  // 為什麼可以這樣:要防的是 client 系統時間本身不準(時區 / 日期被改),
  // 而 performance.now() 量的是單調流逝的時間,不受系統時鐘影響,
  // 所以「後端給的時間 + 流逝的毫秒」仍然是可信的當下時間。
  //
  // 以前每個呼叫端都直接打,光是一次導頁(layout 的 onInit 驗兩支 cookie 的效期)
  // 就要打兩支。
  const onApiGetCommonServerTime = async () => {
    const base = serverTimeBase.value

    // 基準要是「這個執行環境自己量的」才能用(見 stores/project.js 的說明)
    if (base && base.onServer === import.meta.server) {
      serverTime.value = onFormatServerTime(base.epoch + (performance.now() - base.at))

      return { config: null, status: 200, data: null }
    }

    const { config, status, data } = await apiGetCommonServerTime()

    if (status === 200) {
      serverTime.value = onFormatServerTime(data.serverTime)

      // 帶空的 format 會回傳解析後的毫秒字串;解析不出來就不建立基準,
      // 維持原本「每次都打」的行為,不要讓推算建立在錯的起點上。
      const epoch = Number(onFormatDate(data.serverTime))

      if (Number.isFinite(epoch) && epoch > 0) {
        serverTimeBase.value = {
          epoch,
          at: performance.now(),
          onServer: import.meta.server,
        }
      }
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 每個頻道的 access token 各自獨立,換發的流程一樣,差別只有這三項。
  // 取用延到呼叫當下 —— 兩邊的 actions 都用到這一支,在頂層解構會變成互相依賴。
  const ACCESS_CHANNELS = {
    buy: () => {
      const { onGetAccessDataCookie, onApiPostBuyAuthTokenExchange, onApiGetBuyAuthMe } =
        useBuyProjectActions()

      return {
        onGetAccessData: onGetAccessDataCookie,
        onExchange: onApiPostBuyAuthTokenExchange,
        onMe: onApiGetBuyAuthMe,
      }
    },
    member: () => {
      const { onGetAccessDataCookie, onApiPostAuthTokenExchange, onApiGetAuthMe } =
        useMemberProjectActions()

      return {
        onGetAccessData: onGetAccessDataCookie,
        onExchange: onApiPostAuthTokenExchange,
        onMe: onApiGetAuthMe,
      }
    },
  }

  // 這個頻道現在算不算登入中:短 token 還有效就算數,過期就用 30 天的長 token 換一張新的。
  // 回傳 false 代表連長 token 都沒了 —— 要不要因此擋下來由呼叫端決定。
  const onAccessCheck = async (channel) => {
    const onResolveChannel = ACCESS_CHANNELS[channel]

    if (!onResolveChannel) return false

    const { onGetAccessData, onExchange, onMe } = onResolveChannel()

    if (await onGetAccessData()) return true

    const { onGetAuthTokenCookie, onApiGetMemberAuthHandoffToken } = useMemberAuthProjectActions()

    if (!(await onGetAuthTokenCookie())) return false

    const { status: handoffStatus } = await onApiGetMemberAuthHandoffToken(channel)

    if (handoffStatus !== 200) return false

    const { status: exchangeStatus } = await onExchange()

    if (exchangeStatus !== 200) return false

    const { status } = await onMe()

    return status === 200
  }

  // 各頁於取得資料時覆寫全站 SEO(目前驅動 Header 的 H1),保留預設鍵避免缺值。
  const onSetSeo = (seo = {}) => {
    project.seo = { h1: '', ...seo }
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

  return {
    onApiGetCommonServerTime,
    onAccessCheck,
    onSetSeo,
    onUseMeta,
  }
}
