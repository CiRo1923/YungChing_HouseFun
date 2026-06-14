import { nextTick, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onDeepMerge } from '@js/_prototype.js'
import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'

export const defaultDropdownConfig = {
  arrowType: 'caret',
  isDisabled: false,
  position: 'auto',
  // 下拉定位的對象：未設定時抓 elenemtRef，設定時為 CSS selector（.element / #elem）
  target: null,
  // 是否滿版（靠螢幕最左到最右）。可為 boolean 或各斷點設定 { p, pt, tm, t, m }
  isDropdwonFull: false,
}

// 斷點物件可用的 key
const breakpointKeys = ['p', 'pt', 'tm', 't', 'm']

// device 只會回傳 p | t | m，這裡對應各 device 命中的斷點 key（依優先序：單一裝置 > 範圍）
const breakpointDeviceKeys = {
  p: ['p', 'pt'],
  t: ['t', 'pt', 'tm'],
  m: ['m', 'tm'],
}

export const onMergeDropdownConfig = (config = {}, extendConfig = {}) => {
  return onDeepMerge({}, defaultDropdownConfig, extendConfig, config)
}

const onNextFrame = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

const onGetScrollParents = (el) => {
  const parents = []
  let node = el?.parentElement

  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY, overflowX, overflow } = getComputedStyle(node)
    const isScrollable = /(auto|scroll|overlay)/.test(`${overflow}${overflowY}${overflowX}`)

    if (isScrollable && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) {
      parents.push(node)
    }

    node = node.parentElement
  }

  return parents
}

export const useDropdownCore = ({ config, model = ref(null), options, selectedIndex }) => {
  const common = useCommonStore()
  const { device } = storeToRefs(common)
  const { onResize } = useCommonActions()

  const borderWidth = 0
  const elenemtRef = ref(null)
  const dropdownRef = ref(null)
  const dropdownContainerRef = ref(null)
  const dropdownBodyRef = ref(null)
  const dropdownItemRef = ref([])
  const isFocus = ref(false)
  const isActive = ref(false)
  const isOpen = ref(false)

  let scrollTargets = []
  const onScrollClose = () => onSwitchActive(false)

  const onBindScroll = () => {
    onUnbindScroll()

    scrollTargets = onGetScrollParents(elenemtRef.value)
    scrollTargets.forEach((target) => {
      target.addEventListener('scroll', onScrollClose, { passive: true })
    })
  }

  const onUnbindScroll = () => {
    scrollTargets.forEach((target) => {
      target.removeEventListener('scroll', onScrollClose)
    })
    scrollTargets = []
  }

  const onSwitchActive = (value) => {
    const nextValue = value !== undefined ? value : !isActive.value

    isFocus.value = nextValue
    isActive.value = nextValue

    if (!nextValue) {
      isOpen.value = false
      onUnbindScroll()
    }
  }

  const onCloseDropdown = () => {
    isOpen.value = false
    onSwitchActive(false)
  }

  // 判斷是否為斷點物件 { p / pt / tm / t / m }（排除 ref 與 DOM element）
  const onIsBreakpointObject = (value) =>
    value != null &&
    typeof value === 'object' &&
    !('value' in value) &&
    !(typeof Element !== 'undefined' && value instanceof Element) &&
    breakpointKeys.some((key) => key in value)

  // 依目前 device（p | t | m）解析值；非斷點物件則原樣回傳
  const onResolveByDevice = (value) => {
    if (!onIsBreakpointObject(value)) return value

    const keys = breakpointDeviceKeys[device.value] || []
    const matchedKey = keys.find((key) => value[key] != null && value[key] !== false)

    return matchedKey !== undefined ? value[matchedKey] : null
  }

  // 取得定位對象：config.target（.element / #elem，支援斷點物件）優先，否則 fallback 回 elenemtRef
  const onGetAnchorElement = () => {
    const target = onResolveByDevice(config.value.target)

    if (target) {
      const $target =
        typeof target === 'string' ? document.querySelector(target) : (target?.value ?? target)

      if ($target) return $target
    }

    return elenemtRef.value
  }

  // 依目前 device（p | t | m）判斷此斷點是否滿版
  const onIsDropdownFull = () => Boolean(onResolveByDevice(config.value.isDropdwonFull))

  const onDropdownOpen = ({ bodyHeight: bodyHeightOverride = null } = {}) => {
    const { maxItems } = config.value
    const maxItemsNumber = Number(maxItems)
    const $elenemt = onGetAnchorElement()
    const $dropdown = dropdownRef.value
    const $dropdownContainer = dropdownContainerRef.value
    const $dropdownBody = dropdownBodyRef.value || $dropdownContainer
    const refItems = dropdownItemRef.value
    const items = Array.isArray(refItems)
      ? refItems.filter(Boolean)
      : Array.from($dropdownContainer?.children || [])

    if ($elenemt && $dropdown && $dropdownContainer) {
      $dropdown.style.height = ''
      $dropdown.style.width = ''
      $dropdown.style.minWidth = ''
      $dropdownContainer.style.height = ''
      $dropdownContainer.style.overflowY = ''
      $dropdownBody.style.height = ''

      // 滿版時靠螢幕最左到最右，先把寬度撐滿再量測高度（grid 內容會依寬度換行）
      const isFull = onIsDropdownFull()
      const fullWidth = document.documentElement.clientWidth

      if (isFull) {
        $dropdown.style.left = '0px'
        $dropdown.style.width = `${fullWidth}px`
      }

      const element = {
        rect: $elenemt.getBoundingClientRect(),
      }
      const hasMaxItems = Number.isFinite(maxItemsNumber) && maxItemsNumber > 0
      const hasItemsThanMax = hasMaxItems && items.length > maxItemsNumber

      const dropdown = {
        rect: $dropdown.getBoundingClientRect(),
      }
      const itemsContainer = items[0]?.parentElement
      const itemsContainerStyle = itemsContainer ? getComputedStyle(itemsContainer) : null
      const itemsGapY = itemsContainerStyle ? parseFloat(itemsContainerStyle.rowGap) || 0 : 0
      const visibleItemsHeight = hasItemsThanMax
        ? items
            .slice(0, maxItemsNumber)
            .reduce((total, item) => total + item.getBoundingClientRect().height, 0)
        : 0
      const visibleItemsGapHeight = hasItemsThanMax
        ? Math.max(maxItemsNumber - 1, 0) * itemsGapY
        : 0
      const bodyHeight =
        bodyHeightOverride !== null
          ? bodyHeightOverride
          : hasItemsThanMax
            ? visibleItemsHeight + visibleItemsGapHeight
            : null

      if (bodyHeight !== null) {
        $dropdownBody.style.height = `${bodyHeight}px`
      }

      const dropdownStyle = getComputedStyle($dropdown)
      const dropdownPaddingHeight =
        (parseFloat(dropdownStyle.paddingTop) || 0) +
        (parseFloat(dropdownStyle.paddingBottom) || 0)
      const dropdownBorderHeight =
        (parseFloat(dropdownStyle.borderTopWidth) || 0) +
        (parseFloat(dropdownStyle.borderBottomWidth) || 0)

      // 容器套用了 h-full（height:100%），量測時會被父層高度壓縮而塌陷，
      // scrollHeight 又會在 Chrome 漏算底部 padding。改用強制 auto 量測真實
      // border-box（含 padding 與 border），避免高度被裁切。
      // 若是 maxItems 主動限制容器高度的情況則維持限制值。
      const isContainerConstrained = bodyHeight !== null && $dropdownBody === $dropdownContainer

      if (!isContainerConstrained) {
        $dropdownContainer.style.height = 'auto'
      }

      const dropdownHeight =
        $dropdownContainer.getBoundingClientRect().height +
        dropdownPaddingHeight +
        dropdownBorderHeight

      if (!isContainerConstrained) {
        $dropdownContainer.style.height = ''
      }

      const offsetTop = element.rect.height + element.rect.top + window.scrollY
      const offsetLeftMin = dropdown.rect.width + element.rect.left
      const dropdownWidth =
        dropdown.rect.width < element.rect.width ? element.rect.width : dropdown.rect.width
      const offsetLeftMax = element.rect.width + element.rect.left - dropdownWidth
      const bodyWidth = document.body.scrollWidth
      const left =
        ((offsetLeftMin > bodyWidth && offsetLeftMax < 0) || offsetLeftMin < bodyWidth) &&
        config.value.position !== 'right'
          ? element.rect.left
          : offsetLeftMax
      // 滿版時高度抓螢幕高度扣掉 target 計算後的位置（從 target 下緣到螢幕底部），其餘依內容高度
      const fullHeight = window.innerHeight - (element.rect.top + element.rect.height)
      const maxHeight = isFull ? fullHeight : dropdownHeight + borderWidth

      $dropdown.style.height = `${maxHeight}px`
      $dropdown.style.top = `${offsetTop - borderWidth * 2}px`

      // 滿版時不計算 target 的左邊位置，直接靠螢幕最左（left:0）撐滿到最右
      if (isFull) {
        $dropdown.style.left = '0px'
        $dropdown.style.width = `${fullWidth}px`
        // 內容若超過螢幕高度可捲動，避免被裁切
        $dropdownContainer.style.overflowY = 'auto'
      } else {
        $dropdown.style.left = `${left - borderWidth}px`

        if (dropdown.rect.width < element.rect.width) {
          $dropdown.style.minWidth = `${element.rect.width}px`
        }
      }

      isOpen.value = true

      if (model.value !== null && model.value !== '' && Array.isArray(options.value)) {
        const idx = options.value.findIndex(
          (item) => item?.[config.value.schema.value] == model.value
        )

        if (idx < 0) return

        const $selectedItem = items?.[idx]
        if (!$selectedItem) return

        selectedIndex.value = idx

        const selectedItem = {
          rect: $selectedItem.getBoundingClientRect(),
        }
        const dropdownBody = {
          rect: $dropdownBody.getBoundingClientRect(),
        }

        $dropdownBody.scrollTop =
          $selectedItem.offsetTop + selectedItem.rect.height / 2 - dropdownBody.rect.height / 2
      }
    }
  }

  const onElementClick = async () => {
    onSwitchActive()

    await nextTick()
    onDropdownOpen()

    if (isActive.value) {
      onBindScroll()
    }
  }

  const onSelectResize = () => {
    // 先更新 device（p | t | m），下一次開啟也會拿到最新斷點
    onResize()

    if (!isActive.value) return

    // 開啟中才重新定位；onDropdownOpen 內會依最新 device 重算 target / isDropdwonFull 邏輯
    onDropdownOpen()
  }

  const onDropdownHeightUpdate = async ({ frames = 1, target = null, bodyHeight = null } = {}) => {
    await nextTick()

    for (let i = 0; i < frames; i++) {
      await onNextFrame()
      await nextTick()
    }

    const $target = target?.value ?? target
    const targetHeight = $target ? $target.getBoundingClientRect().height : null

    onDropdownOpen({
      bodyHeight: bodyHeight ?? targetHeight,
    })
  }

  onUnmounted(() => {
    onUnbindScroll()
  })

  const isDropdownOutside = (e) => {
    const $elenemt = elenemtRef.value
    const $dropdown = dropdownRef.value
    const isElenemtContains = $elenemt ? !$elenemt.contains(e.target) : true
    const isDropdownContains = $dropdown ? !$dropdown.contains(e.target) : true

    return isElenemtContains && isDropdownContains
  }

  return {
    elenemtRef,
    dropdownRef,
    dropdownContainerRef,
    dropdownBodyRef,
    dropdownItemRef,
    isFocus,
    isActive,
    isOpen,
    onSwitchActive,
    onCloseDropdown,
    onDropdownOpen,
    onDropdownHeightUpdate,
    onElementClick,
    onSelectResize,
    isDropdownOutside,
  }
}
