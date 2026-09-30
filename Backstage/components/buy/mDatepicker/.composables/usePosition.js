/* 展開面板的定位與「點外面關掉」。日期與時間兩支共用。

  面板是 Teleport 到 body 的 absolute 元素,所以座標要自己算 ——
  好處是不會被祖先的 overflow-hidden 裁掉。

  面板「開著沒有」也在這裡 —— 三支元件的 onToggle 一模一樣,而且
  「點外面關掉」「resize 重算位置」都要動它,放在呼叫端只會各寫一份。

  用法:const { containerRef, iconRef, panelRef, isPopup, isActive, isFocus, onToggle, onOpen }
        = usePosition(config)

  三個 ref 由這支建立、由呼叫端綁到 template 上:
    containerRef  觸發用的外框(定位基準)
    iconRef       右側的按鈕(判斷點擊是否在自己身上)
    panelRef      被定位的面板

  isPopup(置中的 popup —— 成立條件見下面那段註解)也在這裡算 ——
  它只影響「要不要算座標」與遮罩的樣式,呼叫端只是轉手給 template。

  document 的 click 與 window 的 resize 監聽由這支自己掛上與移除,
  呼叫端不必再處理(移除時對不上參照是很常見的漏洞)。 */

/* 設定項可以依裝置各給一種值:{ p, pt, tm, t, m },寫法與 css 的前綴同一組語彙。

  **這一份刻意寫在元件自己的資料夾裡,不抽到共用工具。**
  元件庫的元件要能單獨複製走 —— 抽出去之後,複製的人少帶那一支就整組設定失效,
  而失效的樣子是「設定寫了卻沒有反應」,不會報錯。
  同樣的判斷在別的元件裡也有一份,那是刻意的重複。 */
const BREAKPOINT_KEYS = ['p', 'pt', 'tm', 't', 'm']

/* 目前是哪一種裝置,就對應到哪幾個 key。
  device 只會是 p | t | m 三種,而範圍型的前綴(pt 涵蓋桌機與平板、
  tm 涵蓋平板與手機)也會命中其中幾種。

  順序就是優先序:**單一裝置寫在前面,範圍寫在後面** ——
  同時寫了 { t: 'a', tm: 'b' } 時,平板取 'a'。
  指名那一個比涵蓋一片的更明確;反過來的話,寫了單一裝置的值會被範圍值蓋掉,
  看起來像是那一行沒有作用。 */
const BREAKPOINT_DEVICE_KEYS = {
  p: ['p', 'pt'],
  t: ['t', 'pt', 'tm'],
  m: ['m', 'tm'],
}

/* 依目前的裝置取出該用哪一個值。

  不是斷點物件的原樣回傳 —— 那種寫法代表「所有斷點都是這個值」。
  是斷點物件但這個裝置沒有對應的 key 時回 null,呼叫端自己決定那時候用什麼。

  先排除 ref 與 DOM 元素:它們也是物件,不先排掉的話會被當成斷點物件拆開,
  取出來的是 undefined,而那個設定從此無聲地失效。 */
const onResolveByDevice = (value, device) => {
  const isBreakpointObject =
    value != null &&
    typeof value === 'object' &&
    !('value' in value) &&
    !(typeof Element !== 'undefined' && value instanceof Element) &&
    BREAKPOINT_KEYS.some((key) => key in value)

  if (!isBreakpointObject) return value

  const keys = BREAKPOINT_DEVICE_KEYS[device] || []
  const matched = keys.find((key) => value[key] != null && value[key] !== false)

  return matched === undefined ? null : value[matched]
}

export const usePosition = (config) => {
  const { device } = storeToRefs(useCommonStore())
  const { onResize } = useCommonActions()

  const containerRef = ref(null)
  const iconRef = ref(null)
  const panelRef = ref(null)

  const refs = { container: containerRef, icon: iconRef, panel: panelRef }

  /* 手機版才把輸入框交給系統原生的日期欄位(config.mobileSupport 關掉時)。
     那是與「彈窗或浮層」不同的第三種行為:整個面板都不出場,由系統自己畫。 */
  const isDeviceM = computed(() => device.value === 'm')

  /* 面板要用置中的彈窗還是貼著輸入框的浮層 —— 由 config.position 決定,預設浮層。

    position 吃的是斷點語彙,與 css 的前綴同一組說法:

      position: 'popup'          所有斷點都用置中彈窗
      position: { m: 'popup' }   只有手機用彈窗,平板與桌機是浮層
      position: { tm: 'popup' }  平板與手機都用彈窗
      不寫                        都用浮層

    要哪一種由呼叫端說了算,不看裝置自己決定 ——
    畫面窄的時候通常適合彈窗,但那是「通常」:
    寫死成裝置判斷的話,想在手機用貼著輸入框的浮層就沒有辦法,
    而那一種寫法根本表達不出來(關掉 mobileSupport 會變成交給原生的日期欄位,
    那是第三種行為,不是浮層)。

    **同一個鍵也裝著浮層的對齊方向**('auto' 或 'left-top' 那種組合),
    所以解析只做這一次,下面算座標時用的是同一個值 ——
    那裡直接讀 config.value.position 的話,寫成斷點物件時拿到的是一個物件,
    而它會被當成字串去 split,整支元件當場壞掉。

    斷點物件在沒有對應值的裝置上回 null,那時退回 'auto'(浮層自動選邊)。 */
  const position = computed(() => onResolveByDevice(config.value.position, device.value) ?? 'auto')

  const isPopup = computed(() => position.value === 'popup')

  // 面板開著沒有;isFocus 跟著它走(輸入框的外框要顯示 focus 樣式)
  const isActive = ref(false)
  const isFocus = ref(false)

  const onToggle = (value) => {
    isActive.value = value !== undefined ? value : !isActive.value
    isFocus.value = isActive.value
  }

  const onClamp = (value, min, max) => Math.min(Math.max(value, min), max)

  const onOpen = () => {
    /* popup 模式靠 CSS 置中,不需要算座標 —— 但先把先前算過的 inline 座標清掉。

      注意：不清會歪掉:`--popup` 是 `fixed inset-0`,而 inline style 的優先權更高。
          面板開著時跨斷點 resize(isPopup 由 false 翻成 true)就會留著舊的 left / top,
          inset 的 left 被蓋掉、right 卻還是 0,面板被拉成一條並偏到一邊。 */
    if (isPopup.value) {
      if (refs.panel.value) {
        refs.panel.value.style.left = ''
        refs.panel.value.style.top = ''
      }

      return true
    }

    if (!refs.panel.value || !refs.container.value) return false

    /* 走到這裡的值只會是 'auto' 或上下左右組合('left' / 'left-top')——
      'popup' 已經在上面就 return 了,所以這底下不必再判斷它。
      取的是上面解析過的那一份,不再讀一次原始設定:
      原始值可能是斷點物件,那是一個物件,拿去 split 會當場壞掉。 */
    const isAuto = position.value === 'auto'
    const positionX = isAuto ? position.value : position.value.split('-')[0]
    const positionY = isAuto ? position.value : position.value.split('-')[1]

    const rect = refs.container.value.getBoundingClientRect()
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight)
    const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth)
    const scrollTop = window.scrollY
    const scrollLeft = window.scrollX

    const containerTop = rect.top + scrollTop
    const contentWidth = refs.panel.value.scrollWidth
    const contentHeight = refs.panel.value.scrollHeight
    const bottomTop = containerTop + refs.container.value.scrollHeight
    const topTop = containerTop - contentHeight

    const rawTop = positionY === 'top' ? topTop : bottomTop

    const rawLeft =
      positionX === 'left'
        ? scrollLeft + rect.left
        : positionX === 'right'
          ? scrollLeft + rect.right - contentWidth
          : scrollLeft + rect.left + rect.width / 2 - contentWidth / 2

    // 下方放不下就翻到上方;上方也放不下就維持原本設定的位置
    const isBottomOverflow = rawTop - scrollTop + contentHeight > viewHeight
    const isTopFits = topTop >= scrollTop
    const safeTop = positionY !== 'top' && isBottomOverflow && isTopFits ? topTop : rawTop

    refs.panel.value.style.left = `${onClamp(rawLeft, scrollLeft, scrollLeft + viewWidth - contentWidth)}px`
    refs.panel.value.style.top = `${safeTop}px`

    return true
  }

  /* 點在自己(外框 / 按鈕 / 面板)身上都不算外面。
    altInput 時輸入框本身要能點來打字,所以不把 icon 列入判斷。 */
  const onClickOutside = (e) => {
    if (isPopup.value) return

    const $container = refs.container.value
    const $icon = refs.icon.value
    const $panel = refs.panel.value

    if ($container?.contains(e.target)) return
    if ($icon?.contains(e.target)) return
    if (!$panel) return
    if ($panel.contains(e.target)) return

    onToggle(false)
  }

  /* 點到並排的時間欄位時,把日期的浮層收掉 —— 否則兩個浮層會同時開著。
    format 帶時間段時,時間是獨立的一個欄位(Time.vue)並排在日期旁邊,
    日期選擇器(Single / Range)接在自己的 datetime-group 上呼叫這支。

    注意：上面那支 onClickOutside 幫不上忙:它看到 container.contains(target)
        就當成「點在自己身上」而直接 return,而時間欄位就在同一個 container 裡。
        也不能改那支的判斷 —— 時間元件自己也用它,一改就會變成點自己關自己。

    注意：呼叫端要用**捕獲階段**(@pointerdown.capture):時間元件內部的 pointerdown
        有 stopPropagation,冒泡階段收不到。

    注意：選擇器不要寫成 CSS 檔案裡那種 `.\-\-time` —— 那個轉義是給 PostCSS 用的,
        querySelector 認得 `--` 開頭的 class,直接寫就好。 */
  const onClickTimeField = (e) => {
    if (!e.target?.closest?.('.m-datepicker.--time')) return

    onToggle(false)
  }

  // resize 期間連續觸發,只在停下來 200ms 後重算一次位置
  const onResizeDone = (func) => {
    let timer

    return () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(func, 200)
    }
  }

  const onWindowResize = () => {
    onResize()
    onResizeDone(onOpen)()
  }

  // 進來就先量一次,斷點相關的判斷才有值
  onResize()

  /* 注意：移除時必須是「同一個」函式參照 —— 呼叫端各自包一層匿名箭頭的話
      removeEventListener 對不上,每掛載一次就多留一個 listener。
      掛在這裡就不會有那個機會。 */
  onMounted(() => {
    document.addEventListener('click', onClickOutside, true)
    window.addEventListener('resize', onWindowResize)
  })

  onUnmounted(() => {
    document.removeEventListener('click', onClickOutside, true)
    window.removeEventListener('resize', onWindowResize)
  })

  return {
    containerRef,
    iconRef,
    panelRef,
    isDeviceM,
    isPopup,
    isActive,
    isFocus,
    onToggle,
    onOpen,
    onClickTimeField,
  }
}
