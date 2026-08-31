/* 展開面板的定位與「點外面關掉」。日期與時間兩支共用。

  面板是 Teleport 到 body 的 absolute 元素,所以座標要自己算 ——
  好處是不會被祖先的 overflow-hidden 裁掉。

  用法:const { onOpen, onClickOutside } = usePosition(config, isPopup, refs)
    refs.container  觸發用的外框(定位基準)
    refs.icon       右側的按鈕(判斷點擊是否在自己身上)
    refs.panel      被定位的面板 */

export const usePosition = (config, isPopup, refs) => {
  const onClamp = (value, min, max) => Math.min(Math.max(value, min), max)

  const onOpen = () => {
    // popup 模式靠 CSS 置中,不需要算座標
    if (isPopup.value) return true
    if (!refs.panel.value || !refs.container.value) return false

    const { position } = config.value
    const isKeyword = position === 'auto' || position === 'popup'
    const positionX = isKeyword ? position : position.split('-')[0]
    const positionY = isKeyword ? position : position.split('-')[1]

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

    const rawTop =
      positionY === 'popup'
        ? scrollTop + viewHeight / 2 - contentHeight / 2
        : positionY === 'top'
          ? topTop
          : bottomTop

    const rawLeft =
      positionX === 'popup'
        ? scrollLeft + viewWidth / 2 - contentWidth / 2
        : positionX === 'left'
          ? scrollLeft + rect.left
          : positionX === 'right'
            ? scrollLeft + rect.right - contentWidth
            : scrollLeft + rect.left + rect.width / 2 - contentWidth / 2

    // 下方放不下就翻到上方;上方也放不下就維持原本設定的位置
    const isBottomOverflow = rawTop - scrollTop + contentHeight > viewHeight
    const isTopFits = topTop >= scrollTop
    const safeTop =
      positionY !== 'popup' && positionY !== 'top' && isBottomOverflow && isTopFits
        ? topTop
        : rawTop

    refs.panel.value.style.left = `${onClamp(rawLeft, scrollLeft, scrollLeft + viewWidth - contentWidth)}px`
    refs.panel.value.style.top = `${safeTop}px`

    return true
  }

  /* 點在自己(外框 / 按鈕 / 面板)身上都不算外面。
    altInput 時輸入框本身要能點來打字,所以不把 icon 列入判斷。 */
  const onClickOutside = (e, onClose) => {
    if (isPopup.value) return

    const $container = refs.container.value
    const $icon = refs.icon.value
    const $panel = refs.panel.value

    if ($container?.contains(e.target)) return
    if ($icon?.contains(e.target)) return
    if (!$panel) return
    if ($panel.contains(e.target)) return

    onClose()
  }

  // resize 期間連續觸發,只在停下來 200ms 後重算一次位置
  const onResizeDone = (func) => {
    let timer

    return () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(func, 200)
    }
  }

  return { onOpen, onClickOutside, onResizeDone }
}
