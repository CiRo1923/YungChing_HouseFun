import { FormContextKey } from 'vee-validate'

import { onDeepMerge } from '@js/_prototype.js'

export const defaultDropdownConfig = {
  /* 箭頭用哪一支圖示,**留空就不畫箭頭**。

    圖示的名字每個專案都不一樣(各站的 _svg 裡叫什麼由那個站決定),
    所以這裡是設定而不是寫死在畫面區段裡 —— 寫死的話換一個專案要改元件本身,
    而那一段跟著來源覆蓋:改完下一次更新就被蓋回去。

    **先前還有一個 arrowType,決定「用圖示還是用 css 畫」。**
    那個設定只有一個值(圖示)有實作,另一個值的畫面與樣式都被註解掉了 ——
    傳那個值進來不會報錯,箭頭直接不見。一個設定項只有一種值走得通,
    它就不是設定,是誤導。要換形狀就換這裡的圖示名。

    **來源沒有預設的箭頭圖示** —— 箭頭的形狀各站不同(粗細、大小、實心空心),
    放一支進來只會變成每個專案都要換掉的那一支。填你們 _svg 裡有的名字。 */
  arrowIcon: null,
  isDisabled: false,
  position: 'auto',
  // 下拉定位的對象：未設定時抓 elementRef，設定時為 CSS selector（.element / #elem）
  target: null,
  // 是否滿版（靠螢幕最左到最右）。可為 boolean 或各斷點設定 { p, pt, tm, t, m }
  isDropdownFull: false,
}

/* 設定項可以依裝置各給一種值:{ p, pt, tm, t, m },寫法與 css 的前綴同一組語彙。

  **這一份刻意寫在元件自己的檔案裡,不抽到共用工具。**
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

/* 這個值是不是斷點物件。

  排除掉 ref 與 DOM 元素 —— 設定項的值本來就可能是那兩種(定位要貼著哪個元素),
  它們也是物件,不先排掉的話會被當成斷點物件拆開,取出來的是 undefined,
  而那個設定從此無聲地失效。 */
const onIsBreakpointObject = (value) =>
  value != null &&
  typeof value === 'object' &&
  !('value' in value) &&
  !(typeof Element !== 'undefined' && value instanceof Element) &&
  BREAKPOINT_KEYS.some((key) => key in value)

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

    if (
      isScrollable &&
      (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
    ) {
      parents.push(node)
    }

    node = node.parentElement
  }

  return parents
}

/**
 * 這個值算不算「還沒選」。
 *
 * 拿 model 去比對選項的地方用的是寬鬆比對(`==`)——選項的值常常是數字,
 * 而回填進來的 model 多半是字串,用嚴格比對會全部對不上。
 *
 * 但寬鬆比對底下 **`'' == 0` 是成立的**:選項裡有值為 0 的那一項時,
 * 「還沒選」會對到它,畫面上顯示成那一項的文字 —— 使用者沒有選過任何東西,
 * 送出去的卻是 0,而且不會有任何徵兆。
 *
 * `undefined == null` 也是成立的,所以值為 null 的那一項會被沒有綁定過的
 * model 對上,結果一樣。
 *
 * 所以每一處比對之前都要先把未填擋掉。收成一份是因為這件事有三個地方在做,
 * 各寫一次就會像先前那樣:兩處寫了、一處沒寫,而且寫了的那兩處都漏掉 undefined。
 */
export const isUnselected = (value) => value === null || value === undefined || value === ''

export const useDropdownCore = ({
  config,
  model = ref(null),
  options,
  selectedIndex,
  fieldName = null,
  touchOnClose = true,
}) => {
  const common = useCommonStore()
  const { device } = storeToRefs(common)
  const { onResize } = useCommonActions()

  /* 元件不在 <Form> 底下時是 null —— 那時沒有欄位狀態可以標記 */
  const form = inject(FormContextKey, null)

  /**
   * 使用者把下拉收起來的時候,標記這個欄位「碰過了」。
   *
   * 這幾支元件的 <Field> 綁在 <input type="hidden"> 上:使用者操作的是旁邊
   * 那個自訂的下拉,**那個隱藏欄位永遠不會 blur,也永遠不會 change**。
   * 而「碰過」在 vee-validate 裡只有 blur 與送出會設。
   *
   * 少了這一段,這幾支要等到按下送出才算碰過 —— 在那之前「碰過之後值一動就驗」
   * 完全沒有作用:使用者選了又清空,畫面上不會有任何提示,而且不報錯。
   *
   * 用「收起來」而不是「打開」:那才對應一般欄位的 blur(離開這個欄位),
   * 打開的當下人還在選,那時開始驗等於一選就罵人。
   *
   * **可以打字的那一種要把 touchOnClose 關掉**(AutoComplete):它在輸入途中
   * 也會收起下拉(字數不夠時),跟著標記的話,使用者打第一個字就算碰過,
   * 之後每打一個字都驗一次 —— 打到一半跳紅字,正是這個機制要避免的事。
   * 那一種自己在「選了某一項」的時候呼叫這支。
   */
  const onMarkTouched = () => {
    if (!form) return

    const names = toValue(fieldName)

    for (const name of Array.isArray(names) ? names : [names]) {
      if (name) form.setFieldTouched?.(name, true)
    }
  }

  const borderWidth = 0
  const elementRef = ref(null)
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

    scrollTargets = onGetScrollParents(elementRef.value)
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

  /* 收合動畫結束時走這裡 —— 收起來的路徑不只一條(選完、點外面、捲動、按 Esc),
     全部匯流到這一個點,標記在這裡才每一條都涵蓋到。 */
  const onCloseDropdown = () => {
    isOpen.value = false
    onSwitchActive(false)

    if (touchOnClose) onMarkTouched()
  }

  /* 依目前的裝置解析斷點物件;不是斷點物件的原樣回傳
     (那種寫法代表「所有斷點都是這個值」)。
     這個裝置沒有對應的 key 時回 null,呼叫端自己決定那時候用什麼。 */
  const onResolveByDevice = (value) => {
    if (!onIsBreakpointObject(value)) return value

    const keys = BREAKPOINT_DEVICE_KEYS[device.value] || []
    const matched = keys.find((key) => value[key] != null && value[key] !== false)

    return matched === undefined ? null : value[matched]
  }

  // 取得定位對象：config.target（.element / #elem，支援斷點物件）優先，否則 fallback 回 elementRef
  const onGetAnchorElement = () => {
    const target = onResolveByDevice(config.value.target)

    if (target) {
      const $target =
        typeof target === 'string' ? document.querySelector(target) : (target?.value ?? target)

      if ($target) return $target
    }

    return elementRef.value
  }

  // 依目前 device（p | t | m）判斷此斷點是否滿版
  const onIsDropdownFull = () => Boolean(onResolveByDevice(config.value.isDropdownFull))

  const onDropdownOpen = ({ bodyHeight: bodyHeightOverride = null } = {}) => {
    const { maxItems } = config.value
    const maxItemsNumber = Number(maxItems)
    const $element = onGetAnchorElement()
    const $dropdown = dropdownRef.value
    const $dropdownContainer = dropdownContainerRef.value
    const $dropdownBody = dropdownBodyRef.value || $dropdownContainer
    const refItems = dropdownItemRef.value
    const items = Array.isArray(refItems)
      ? refItems.filter(Boolean)
      : Array.from($dropdownContainer?.children || [])

    if ($element && $dropdown && $dropdownContainer) {
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
        rect: $element.getBoundingClientRect(),
      }
      const hasMaxItems = Number.isFinite(maxItemsNumber) && maxItemsNumber > 0
      const hasItemsThanMax = hasMaxItems && items.length > maxItemsNumber

      const dropdown = {
        rect: $dropdown.getBoundingClientRect(),
      }
      const itemsContainer = items[0]?.parentElement
      const itemsContainerStyle = itemsContainer ? getComputedStyle(itemsContainer) : null
      const itemsGapY = itemsContainerStyle ? parseFloat(itemsContainerStyle.rowGap) || 0 : 0
      // 用 offsetHeight(佈局尺寸)而非 getBoundingClientRect().height:
      // 展開動畫的 enter-from 是 height:0 !important + overflow-hidden,
      // 此刻量測 rect 會被壓成 0;offsetHeight 不受父層高度/overflow 影響。
      const visibleItemsHeight = hasItemsThanMax
        ? items.slice(0, maxItemsNumber).reduce((total, item) => total + item.offsetHeight, 0)
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
        // 限制高度時需可捲動,否則超過 maxItems 的項目會被裁掉且捲不到(選中項也 scroll 不到)
        // $dropdownBody.style.overflowY = 'auto'
      }

      const dropdownStyle = getComputedStyle($dropdown)
      const dropdownPaddingHeight =
        (parseFloat(dropdownStyle.paddingTop) || 0) + (parseFloat(dropdownStyle.paddingBottom) || 0)
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
        $dropdownContainer.offsetHeight + dropdownPaddingHeight + dropdownBorderHeight

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

      if (!isUnselected(model.value) && Array.isArray(options.value)) {
        // 選中比對欄位:優先 schema.model(AutoComplete 用),沒有則 fallback schema.value(Select 用)
        const valueKey = config.value.schema.model ?? config.value.schema.value
        const idx = options.value.findIndex((item) => item?.[valueKey] == model.value)

        if (idx < 0) return

        const $selectedItem = items?.[idx]
        if (!$selectedItem) return

        selectedIndex.value = idx

        // 置中捲動:讓選中項落在可視範圍中央(例:maxItems=5 → 第 3 個)。
        // 用「可視項數」而非容器 clientHeight —— 量測發生在 Transition enter-from(dropdown h-0)期間,
        // 此時 clientHeight/getBoundingClientRect 會是 0;而 offsetTop/offsetHeight 是佈局值,始終準確。
        const visibleCount = hasMaxItems ? Math.min(maxItemsNumber, items.length) : items.length
        const centerOffset = Math.floor(visibleCount / 2)

        $dropdownBody.scrollTop = Math.max(
          $selectedItem.offsetTop - centerOffset * $selectedItem.offsetHeight,
          0
        )
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

  // 直接開啟(非 toggle):input 型(如 AutoComplete)在 focus / 輸入時呼叫,
  // 強制開啟後定位並綁定捲動自動關閉(onElementClick 是 toggle,不適用 input)。
  const onDropdownActive = async () => {
    onSwitchActive(true)

    await nextTick()
    onDropdownOpen()
    onBindScroll()
  }

  const onSelectResize = () => {
    // 先更新 device（p | t | m），下一次開啟也會拿到最新斷點
    onResize()

    if (!isActive.value) return

    // 開啟中才重新定位；onDropdownOpen 內會依最新 device 重算 target / isDropdownFull 邏輯
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
    const $element = elementRef.value
    const $dropdown = dropdownRef.value
    const isElementContains = $element ? !$element.contains(e.target) : true
    const isDropdownContains = $dropdown ? !$dropdown.contains(e.target) : true

    return isElementContains && isDropdownContains
  }

  return {
    elementRef,
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
    onDropdownActive,
    onSelectResize,
    isDropdownOutside,
    onMarkTouched,
  }
}
