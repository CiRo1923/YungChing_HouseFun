import { nextTick, onUnmounted, ref } from 'vue'
import { onDeepMerge } from '@js/_prototype.js'

export const defaultDropdownConfig = {
  arrowType: 'caret',
  isDisabled: false,
  position: 'auto',
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

  const onDropdownOpen = ({ bodyHeight: bodyHeightOverride = null } = {}) => {
    const { maxItems } = config.value
    const maxItemsNumber = Number(maxItems)
    const $elenemt = elenemtRef.value
    const $dropdown = dropdownRef.value
    const $dropdownContainer = dropdownContainerRef.value
    const $dropdownBody = dropdownBodyRef.value || $dropdownContainer
    const refItems = dropdownItemRef.value
    const items = Array.isArray(refItems)
      ? refItems.filter(Boolean)
      : Array.from($dropdownContainer?.children || [])

    if ($elenemt && $dropdown && $dropdownContainer) {
      $dropdown.style.height = ''
      $dropdownContainer.style.height = ''
      $dropdownBody.style.height = ''

      const element = {
        rect: $elenemt.getBoundingClientRect(),
      }
      const hasMaxItems = Number.isFinite(maxItemsNumber) && maxItemsNumber > 0
      const hasItemsThanMax = hasMaxItems && items.length > maxItemsNumber

      const dropdown = {
        rect: $dropdown.getBoundingClientRect(),
      }
      const containerStyle = getComputedStyle($dropdownContainer)
      const containerBorderHeight =
        (parseFloat(containerStyle.borderTopWidth) || 0) +
        (parseFloat(containerStyle.borderBottomWidth) || 0)
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

      const dropdownHeight = $dropdownContainer.scrollHeight + containerBorderHeight

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
      const maxHeight = dropdownHeight + borderWidth

      $dropdown.style.height = `${maxHeight}px`
      $dropdown.style.top = `${offsetTop - borderWidth * 2}px`
      $dropdown.style.left = `${left - borderWidth}px`

      if (dropdown.rect.width < element.rect.width) {
        $dropdown.style.minWidth = `${element.rect.width}px`
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
