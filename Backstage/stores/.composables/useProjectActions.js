const useProjectActions = () => {
  /* 寫這一頁的 head —— 標題、描述、分享用的 og、canonical。

    放在這一支而不是共用的那一支行為(useCommonActions):那一支是整套覆蓋的對象,
    寫在那裡的話改完下一次更新就消失,而消失的當下沒有訊息,
    只是搜尋引擎看到的東西變回別人的設定。

    每個站要輸出哪幾項也不一樣 —— canonical 要不要補結尾斜線、
    og 的圖片尺寸怎麼取、要不要吐結構化資料,而這裡只需要最基本的那幾項。 */
  const onUseMeta = (meta) => {
    const { title, description, url } = meta

    useHead(() => ({
      title: title,
      meta: [
        {
          property: 'og:title',
          itemprop: 'name',
          content: title,
        },
        {
          name: 'description',
          property: 'og:description',
          itemprop: 'description',
          content: description,
        },
        {
          property: 'og:url',
          itemprop: 'url',
          content: url.href,
        },
      ],
      link: [
        {
          rel: 'canonical',
          href: url.href,
        },
      ],
    }))
  }

  return {
    onUseMeta,
  }
}

export default useProjectActions
