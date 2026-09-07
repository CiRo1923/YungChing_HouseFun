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

export const usePosition = (config) => {
  const { device } = storeToRefs(useCommonStore())
  const { onResize } = useCommonActions()

  const containerRef = ref(null)
  const iconRef = ref(null)
  const panelRef = ref(null)

  const refs = { container: containerRef, icon: iconRef, panel: panelRef }

  const isDeviceM = computed(() => device.value === 'm')

  /* 置中的 popup 有兩種成立方式,兩邊都要收:
      config.position === 'popup'  呼叫端明確要求(不分裝置)
      手機 + mobileSupport         自動切換;關掉則交給原生的 input

    ⚠️ 兩個條件都留著,這支才能在不同專案的複本之間保持一份 ——
        有的專案只用 position、有的只用裝置判斷,少一個就會少一種行為。
        沒有那個 config 鍵的專案讀到 undefined,那一半自然不成立。 */
  const isPopup = computed(
    () => config.value.position === 'popup' || (isDeviceM.value && !!config.value.mobileSupport)
  )

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

      ⚠️ 不清會歪掉:`--popup` 是 `fixed inset-0`,而 inline style 的優先權更高。
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

    /* 走到這裡的 position 只會是 'auto' 或上下左右組合('left' / 'left-top')——
      'popup' 已經在上面就 return 了,所以這底下不必再判斷它。 */
    const { position } = config.value
    const isAuto = position === 'auto'
    const positionX = isAuto ? position : position.split('-')[0]
    const positionY = isAuto ? position : position.split('-')[1]

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

    ⚠️ 上面那支 onClickOutside 幫不上忙:它看到 container.contains(target)
        就當成「點在自己身上」而直接 return,而時間欄位就在同一個 container 裡。
        也不能改那支的判斷 —— 時間元件自己也用它,一改就會變成點自己關自己。

    ⚠️ 呼叫端要用**捕獲階段**(@pointerdown.capture):時間元件內部的 pointerdown
        有 stopPropagation,冒泡階段收不到。

    ⚠️ 選擇器不要寫成 CSS 檔案裡那種 `.\-\-time` —— 那個轉義是給 PostCSS 用的,
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

  /* ⚠️ 移除時必須是「同一個」函式參照 —— 呼叫端各自包一層匿名箭頭的話
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
