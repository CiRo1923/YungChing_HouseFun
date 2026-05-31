import { nextTick, ref } from 'vue'
import { onDeepMerge } from '@js/_prototype.js'

export const defaultDropdownConfig = {
  arrowType: 'caret',
  isDisabled: false,
  position: 'auto',
}

export const onMergeDropdownConfig = (config = {}, extendConfig = {}) => {
  return onDeepMerge(onDeepMerge(defaultDropdownConfig, extendConfig), config)
}

export const useDropdownCore = ({ config, model = ref(null), options, selectedIndex }) => {
  const borderWidth = 0
  const elenemtRef = ref(null)
  const dropdownRef = ref(null)
  const dropdownContainerRef = ref(null)
  const dropdownItemRef = ref(null)
  const isFocus = ref(false)
  const isActive = ref(false)
  const isOpen = ref(false)

  const onSwitchActive = (value) => {
    const nextValue = value !== undefined ? value : !isActive.value

    isFocus.value = nextValue
    isActive.value = nextValue

    if (!nextValue) {
      isOpen.value = false
    }
  }

  const onCloseDropdown = () => {
    isOpen.value = false
    onSwitchActive(false)
  }

  const onDropdownOpen = () => {
    const { maxItems } = config.value
    const maxItemsNumber = Number(maxItems)
    const $elenemt = elenemtRef.value
    const $dropdown = dropdownRef.value
    const $dropdownContainer = dropdownContainerRef.value
    const refItems = dropdownItemRef.value
    const items = Array.isArray(refItems)
      ? refItems
      : Array.from($dropdownContainer?.children || [])

    if ($elenemt && $dropdown && $dropdownContainer) {
      $dropdown.style.height = ''
      $dropdownContainer.style.height = ''

      const element = {
        rect: $elenemt.getBoundingClientRect(),
      }
      const hasMaxItems = Number.isFinite(maxItemsNumber) && maxItemsNumber > 0
      const hasItemsThanMax = hasMaxItems && items.length > maxItemsNumber

      const dropdown = {
        rect: $dropdown.getBoundingClientRect(),
      }
      const containerStyle = getComputedStyle($dropdownContainer)
      const containerPaddingHeight =
        (parseFloat(containerStyle.paddingTop) || 0) +
        (parseFloat(containerStyle.paddingBottom) || 0)
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
      const dropdownHeight = hasItemsThanMax
        ? containerPaddingHeight +
          containerBorderHeight +
          visibleItemsHeight +
          visibleItemsGapHeight
        : $dropdownContainer.scrollHeight + containerBorderHeight
      const containerHeight = hasItemsThanMax
        ? containerPaddingHeight +
          containerBorderHeight +
          visibleItemsHeight +
          visibleItemsGapHeight
        : null

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
      $dropdownContainer.style.height = hasItemsThanMax ? `${containerHeight}px` : ''
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

        $dropdownContainer.scrollTop =
          $selectedItem.offsetTop + selectedItem.rect.height / 2 - maxHeight / 2
      }
    }
  }

  const onElementClick = async () => {
    onSwitchActive()

    await nextTick()
    onDropdownOpen()
  }

  const onSelectResize = () => {
    onDropdownOpen()
  }

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
    dropdownItemRef,
    isFocus,
    isActive,
    isOpen,
    onSwitchActive,
    onCloseDropdown,
    onDropdownOpen,
    onElementClick,
    onSelectResize,
    isDropdownOutside,
  }
}
