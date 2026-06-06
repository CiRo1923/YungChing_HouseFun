const defaultConfig = {
  isTheadFixed: false,
  noData: {
    icon: null,
    message: '尚無資料',
  },
}

const defaultSetClass = {
  main: '',
  container: '',
  content: '',
  thead: '',
  theadTr: '',
  theadTh: '',
  theadLabel: '',
  tbody: '',
  tbodyTr: '',
  tbodyTd: '',
  tfoot: '',
  tfootTr: '',
  tfootTd: '',
  footer: '',
  noData: '',
  checkbox: {}, // 傳給 BuyMFormCheckBox 的 setClass，需為物件
}

/**
 * m-table 共用核心邏輯（Default / CheckboxResponsiv 共用）
 *
 * @param {Object} props - 元件 props（thead / tbody / tfoot / table / config / setClass）
 * @param {Object} [options]
 * @param {import('vue').Ref<boolean>|(() => boolean)|boolean} [options.canFixThead=true]
 *   是否允許 thead 固定。CheckboxResponsiv 在手機版會傳入 false，使 isTheadFixedActive 永遠關閉。
 */
export default (props, options = {}) => {
  const { canFixThead = true } = options

  const slots = useSlots()

  const containerRef = ref(null)
  const tableContentRef = ref(null)
  const theadRef = ref(null)

  const config = computed(() => {
    return {
      ...defaultConfig,
      ...props.config,
      noData: {
        ...defaultConfig.noData,
        ...props.config?.noData,
      },
    }
  })

  const setClass = computed(() => {
    return {
      ...defaultSetClass,
      ...props.setClass,
    }
  })

  const thead = computed(() => {
    return props.table ? props.table.thead || [] : props.thead || []
  })

  const tbody = computed(() => {
    return props.table ? props.table.tbody || [] : props.tbody || []
  })

  const tfoot = computed(() => {
    return props.table ? props.table.tfoot || [] : props.tfoot || []
  })

  const hasTbody = computed(() => {
    return Array.isArray(tbody.value) && tbody.value.length > 0
  })

  const hasTfoot = computed(() => {
    return Array.isArray(tfoot.value) && tfoot.value.length > 0
  })

  const isTheadFixedActive = ref(false)
  const fixedTheadStyle = ref({})

  // 是否真的要啟用固定 thead：需開啟 config 且當前裝置允許（CheckboxResponsiv 手機版會關閉）
  const isTheadFixedEnabled = computed(() => {
    return config.value.isTheadFixed && toValue(canFixThead)
  })

  const getScopeValue = (item, column) => {
    return item?.[column.id]
  }

  const getSpan = (column, type, key) => {
    return column?.[key]?.[type] || null
  }

  const getColumnClass = (column, type) => {
    return column?.class?.[type] || ''
  }

  const onResetFixedThead = () => {
    isTheadFixedActive.value = false
    fixedTheadStyle.value = {}
  }

  const onSyncFixedThead = () => {
    if (!isTheadFixedEnabled.value) {
      onResetFixedThead()
      return
    }

    const $table = tableContentRef.value
    const $thead = theadRef.value
    const $container = containerRef.value

    if (!$table || !$thead || !$container) {
      onResetFixedThead()
      return
    }

    const containerRect = $container.getBoundingClientRect()
    const tableRect = $table.getBoundingClientRect()
    const theadHeight = $thead.offsetHeight
    const isContainerScroll = $container.scrollHeight > $container.clientHeight
    const isActive = isContainerScroll
      ? $container.scrollTop > 0 && tableRect.bottom > containerRect.top + theadHeight
      : tableRect.top <= 0 && tableRect.bottom > theadHeight

    isTheadFixedActive.value = isActive

    if (!isActive) {
      fixedTheadStyle.value = {}
      return
    }

    fixedTheadStyle.value = isContainerScroll
      ? {
          transform: `translateY(${$container.scrollTop}px)`,
        }
      : {}
  }

  const onWindowChange = () => {
    onSyncFixedThead()
  }

  const onContainerScroll = () => {
    onSyncFixedThead()
  }

  watch(
    () => [thead.value, tbody.value, isTheadFixedEnabled.value],
    async () => {
      await nextTick()
      onSyncFixedThead()
    },
    {
      deep: true,
    }
  )

  onMounted(async () => {
    await nextTick()
    onSyncFixedThead()
    containerRef.value?.addEventListener('scroll', onContainerScroll)
    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, true)
  })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', onContainerScroll)
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('scroll', onWindowChange, true)
  })

  return {
    slots,
    containerRef,
    tableContentRef,
    theadRef,
    config,
    setClass,
    thead,
    tbody,
    tfoot,
    hasTbody,
    hasTfoot,
    isTheadFixedActive,
    fixedTheadStyle,
    isTheadFixedEnabled,
    getScopeValue,
    getSpan,
    getColumnClass,
    onSyncFixedThead,
  }
}
