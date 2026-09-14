import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { onDeepMerge } from '@js/_prototype.js'

export const defaultTabConfig = {
  active: null,
  containerMode: 'multiple', // multiple / single / false
  schema: {
    id: 'id',
    label: 'label',
  },
}

export const onMergeTabConfig = (config = {}, extendConfig = {}) => {
  return onDeepMerge({}, defaultTabConfig, extendConfig, config)
}

// 把「可依裝置設定的物件」解析成目前裝置對應的值。device 只會是 p / t / m,
// 故需把 pt / tm 區間對應進來;解析順序為先比單一 device、再比區間。
// 非物件值直接原樣回傳;都沒對應到則回 null。
//
// null / undefined 也走原樣回傳那一條:typeof null 是 'object',不特別擋的話
// 它會被當成裝置物件,往下讀 value[key] 就是讀 null 的屬性。
//
// 這一份寫在元件自己的核心裡,不從共用函式檔取用 —— 這個元件要能整包搬到
// 別的專案,少一個外部依賴就少一個搬過去會斷掉的地方。
export const onResolveByDevice = (value, device) => {
  const breakpointDeviceKeys = {
    p: ['p', 'pt'],
    t: ['t', 'pt', 'tm'],
    m: ['m', 'tm'],
  }

  if (value == null || typeof value !== 'object') return value

  const keys = breakpointDeviceKeys[device] || []
  const matchedKey = keys.find((key) => value[key] != null && value[key] !== false)

  return matchedKey !== undefined ? value[matchedKey] : null
}

// 連結標籤解析：href -> a、to -> router-link、否則 button
export const onTabHeaderAs = (item) => {
  const { to, href } = item

  return href ? 'a' : to ? 'router-link' : 'button'
}

export const onTabHeaderBind = (item) => {
  const as = onTabHeaderAs(item)
  const { to, href, target } = item

  return as === 'router-link'
    ? {
        to: to,
        ...(target
          ? {
              target,
              rel: 'noopener',
            }
          : {}),
      }
    : as === 'a'
      ? {
          href: href,
          target: '_blank',
          rel: 'noopener',
        }
      : {
          type: as,
        }
}

export const useTabCore = ({ config }) => {
  const activeIndex = ref(config.value.active)
  // 切換動畫用
  const rafId = ref(null)
  const prevIndex = ref(null)
  const direction = ref(null)
  const animating = ref(null)
  const isShowItem = ref(false)

  const onInit = () => {
    const { active } = config.value
    activeIndex.value = active
    // prevIndex.value = active
  }

  const onStartAnimate = () => {
    onCancelAnimationFram()

    // 先清掉 animating，確保是「無 transition 的初始狀態」
    animating.value = null

    // 下一個 frame 再開啟 transition
    rafId.value = requestAnimationFrame(() => {
      animating.value = '--animating'
      rafId.value = null

      if (!direction.value) {
        onReset()
      }
    })
  }

  const onClick = async (item, index) => {
    const { href, to } = item
    const { containerMode } = config.value
    const isURL = !!(href || to)
    const isSingle = containerMode === 'single'
    const isMultiple = containerMode === 'multiple'

    if (isURL) return
    if (isShowItem.value) return
    // if (prevIndex.value === activeIndex.value) return

    prevIndex.value = activeIndex.value // 儲存上一次點擊的 activeIndex
    activeIndex.value = index
    direction.value =
      activeIndex.value > prevIndex.value
        ? '--left'
        : activeIndex.value < prevIndex.value
          ? '--right'
          : null
    isShowItem.value = direction.value ? true : false

    await nextTick()

    if (isSingle) {
      onReset()
    }

    if (isMultiple) {
      onStartAnimate()
    }
  }

  //  動畫結束
  const onTrackTransitionEnd = async (e) => {
    if (e.propertyName !== 'transform') return false
    if (!isShowItem.value) return false

    onReset()

    return true
  }

  const onCancelAnimationFram = () => {
    if (rafId.value != null) cancelAnimationFrame(rafId.value)
  }

  const onReset = () => {
    animating.value = null
    direction.value = null
    isShowItem.value = false
    prevIndex.value = null
  }

  onMounted(() => {
    onInit()
  })

  onUnmounted(() => {
    onCancelAnimationFram()
  })

  return {
    activeIndex,
    rafId,
    prevIndex,
    direction,
    animating,
    isShowItem,
    onHeaderAs: onTabHeaderAs,
    onHeaderBind: onTabHeaderBind,
    onInit,
    onStartAnimate,
    onClick,
    onTrackTransitionEnd,
    onCancelAnimationFram,
    onReset,
  }
}
