import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/.composables/useCommonActions.js'

export const useSwiperCore = ({ props, emits }) => {
  const common = useCommonStore()
  const { device } = storeToRefs(common)
  const { onResize } = useCommonActions()

  const wrapperRef = ref(null)
  const containerRef = ref(null)

  const activeIndex = ref(0)
  const containerWidth = ref(0)
  const wrapperGap = ref(0)
  const autoplayTimer = ref(null)
  const resizeObserver = ref(null)
  const resizeRefreshTimer = ref(null)
  const dragOffset = ref(0)
  const isDragging = ref(false)
  const isTransitioning = ref(true)
  const autoplay = reactive({
    running: false,
    paused: false,
  })
  const autoplayTimeLeft = ref(0)
  const autoplayStartTime = ref(0)
  const pausedByInteraction = ref(false)
  const pausedByPointerEnter = ref(false)
  const isTouched = ref(false)
  const movedByTouch = ref(false)
  const pointerCurrentX = ref(0)
  const pointerStartX = ref(0)
  const pointerStartY = ref(0)
  const pointerCurrentY = ref(0)
  const activePointerId = ref(null)
  const allowClick = ref(true)
  const renderKey = ref(0)

  const swiperGroup = inject('mSwiperGroup', null)
  const swiperName = computed(() => props.name || swiperGroup?.name)

  const responsiveKeys = ['p', 'pt', 'tm', 't', 'm']
  const responsiveConfigKeys = [
    'loop',
    'autoplay',
    'nav',
    'pagination',
    'autoWidth',
    'slidesPerView',
    'initialSlide',
    'loopAdditionalSlides',
    'speed',
    'touchThreshold',
  ]

  const hasResponsiveConfig = (value) => {
    return value && typeof value === 'object' && responsiveKeys.some((key) => key in value)
  }

  const isMatchDevice = (value) => {
    const currentDevice = device.value

    return Boolean(
      value[currentDevice] ||
      (value.pt && ['p', 't'].includes(currentDevice)) ||
      (value.tm && ['t', 'm'].includes(currentDevice))
    )
  }

  const resolveResponsiveConfig = (value) => {
    const resolvedValue = unref(value)

    if (!hasResponsiveConfig(resolvedValue)) return resolvedValue

    const sharedConfig = Object.fromEntries(
      Object.entries(resolvedValue).filter(([key]) => !responsiveKeys.includes(key))
    )

    if (Object.keys(sharedConfig).length) {
      return isMatchDevice(resolvedValue) ? sharedConfig : false
    }

    if ('p' in resolvedValue && device.value === 'p') return resolvedValue.p
    if ('t' in resolvedValue && device.value === 't') return resolvedValue.t
    if ('m' in resolvedValue && device.value === 'm') return resolvedValue.m
    if ('pt' in resolvedValue && ['p', 't'].includes(device.value)) return resolvedValue.pt
    if ('tm' in resolvedValue && ['t', 'm'].includes(device.value)) return resolvedValue.tm

    return false
  }

  const rawConfig = computed(() => {
    return {
      loop: false,
      autoplay: false,
      nav: false,
      pagination: false,
      autoWidth: false,
      slidesPerView: 1,
      initialSlide: 'first',
      loopAdditionalSlides: 0,
      speed: 500,
      touchThreshold: 50,
      ...props.config,
    }
  })

  const swiperConfig = computed(() => {
    return Object.fromEntries(
      Object.entries(rawConfig.value).map(([key, value]) => {
        const resolvedValue = responsiveConfigKeys.includes(key)
          ? resolveResponsiveConfig(value)
          : unref(value)

        if (key === 'slidesPerView' && resolvedValue === false) return [key, 1]

        return [key, resolvedValue]
      })
    )
  })

  const setClass = computed(() => {
    const { item, slide, ...customClass } = props.setClass

    return {
      main: '',
      container: '',
      wrapper: '',
      slide: slide || item || '',
      nav: '',
      navPrev: '',
      navNext: '',
      pagination: '',
      ...customClass,
    }
  })

  const navConfig = computed(() => {
    if (!swiperConfig.value.nav) return false

    return {
      icon: {
        prev: 'chevron_left',
        next: 'chevron_right',
      },
      ...(typeof swiperConfig.value.nav === 'object' ? swiperConfig.value.nav : {}),
    }
  })

  const onMergeClass = (...classNames) => {
    return classNames.filter(Boolean).join(' ')
  }

  const paginationConfig = computed(() => {
    if (!swiperConfig.value.pagination) return false

    const pageCount = isLoop.value ? props.data.length : maxIndex.value + 1
    if (pageCount <= 1) return false

    const externalConfig =
      typeof swiperConfig.value.pagination === 'object' ? swiperConfig.value.pagination : {}

    return {
      clickable: true,
      ...externalConfig,
      bulletClass: onMergeClass(
        'swiper-pagination-bullet',
        'm-swiper-pagination-bullet',
        externalConfig.bulletClass
      ),
      bulletActiveClass: onMergeClass(
        'swiper-pagination-bullet-active',
        '--active',
        externalConfig.bulletActiveClass
      ),
    }
  })

  const autoplayConfig = computed(() => {
    const value = unref(swiperConfig.value.autoplay)

    if (!value || props.data.length <= 1) return false

    if (typeof value === 'object') {
      const delay = Number(value.delay)

      return {
        delay: Number.isFinite(delay) ? delay : 3000,
        pauseOnMouseEnter: Boolean(value.pauseOnMouseEnter),
        disableOnInteraction:
          'disableOnInteraction' in value ? Boolean(value.disableOnInteraction) : false,
        reverseDirection: Boolean(value.reverseDirection),
        stopOnLastSlide: Boolean(value.stopOnLastSlide),
        waitForTransition: 'waitForTransition' in value ? Boolean(value.waitForTransition) : true,
      }
    }

    return {
      delay: 3000,
      pauseOnMouseEnter: false,
      disableOnInteraction: false,
      reverseDirection: false,
      stopOnLastSlide: false,
      waitForTransition: true,
    }
  })

  const slidesPerView = computed(() => {
    if (swiperConfig.value.autoWidth) return 'auto'

    const value = Number(swiperConfig.value.slidesPerView)

    return Number.isFinite(value) && value > 0 ? value : 1
  })

  const slidesPerViewCount = computed(() => {
    if (slidesPerView.value === 'auto') return 1

    return Math.ceil(slidesPerView.value)
  })

  const speed = computed(() => {
    const value = Number(swiperConfig.value.speed)

    return Number.isFinite(value) ? value : 500
  })

  const touchThreshold = computed(() => {
    const value = Number(swiperConfig.value.touchThreshold)

    return Number.isFinite(value) ? value : 50
  })

  const loopAdditionalSlides = computed(() => {
    const value = Number(swiperConfig.value.loopAdditionalSlides)

    return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 0
  })

  const isLoop = computed(() => {
    return Boolean(swiperConfig.value.loop && props.data.length > slidesPerViewCount.value)
  })

  const cloneCount = computed(() => {
    if (!isLoop.value) return 0

    return Math.min(slidesPerViewCount.value * 2 + loopAdditionalSlides.value, props.data.length)
  })

  const displayData = computed(() => {
    if (!isLoop.value) return props.data

    const head = props.data.slice(0, cloneCount.value)
    const tail = props.data.slice(-cloneCount.value)

    return [...tail, ...props.data, ...head]
  })

  const realIndex = computed(() => {
    if (!props.data.length) return 0
    if (!isLoop.value) return Math.min(activeIndex.value, props.data.length - 1)

    return (activeIndex.value - cloneCount.value + props.data.length) % props.data.length
  })

  const paginationLength = computed(() => {
    if (isLoop.value) return props.data.length
    return maxIndex.value + 1
  })

  const slideWidth = computed(() => {
    if (slidesPerView.value === 'auto') return 'auto'
    if (!containerWidth.value) return 0

    const visibleGapCount = Math.max(slidesPerView.value - 1, 0)
    const totalGap = wrapperGap.value * visibleGapCount

    return (containerWidth.value - totalGap) / slidesPerView.value
  })

  const maxTranslateX = computed(() => {
    if (slidesPerView.value !== 'auto') {
      if (!slideWidth.value) return 0

      const totalWidth =
        slideWidth.value * displayData.value.length +
        wrapperGap.value * Math.max(displayData.value.length - 1, 0)

      return Math.max(totalWidth - containerWidth.value, 0)
    }

    if (!wrapperRef.value || !containerRef.value) return 0

    return Math.max(containerRef.value.scrollWidth - wrapperRef.value.clientWidth, 0)
  })

  const maxIndex = computed(() => {
    if (!props.data.length) return 0
    if (isLoop.value) return displayData.value.length - 1
    if (slidesPerView.value === 'auto') return props.data.length - 1

    return Math.max(Math.ceil(props.data.length - slidesPerView.value), 0)
  })

  const isBeginning = computed(() => {
    return !isLoop.value && activeIndex.value <= 0
  })

  const isEnd = computed(() => {
    return !isLoop.value && activeIndex.value >= maxIndex.value
  })

  const getRealIndexByInitialSlide = (value = swiperConfig.value.initialSlide) => {
    if (!props.data.length) return 0

    if (value === 'last') {
      return props.data.length - 1
    }

    if (value === 'center') {
      return Math.floor((props.data.length - 1) / 2)
    }

    if (value === 'first') {
      return 0
    }

    const index = Number(value)

    return Number.isFinite(index) ? Math.trunc(index) : 0
  }

  const getActiveIndexByRealIndex = (index) => {
    const realIndex = Math.min(Math.max(index, 0), Math.max(props.data.length - 1, 0))
    const targetIndex = isLoop.value ? realIndex + cloneCount.value : realIndex

    return Math.min(Math.max(targetIndex, 0), maxIndex.value)
  }

  const initialIndex = computed(() => {
    return getActiveIndexByRealIndex(getRealIndexByInitialSlide())
  })

  const getTranslateByIndex = (index) => {
    const wrapper = containerRef.value

    if (slidesPerView.value === 'auto') {
      return wrapper?.children?.[index]?.offsetLeft || 0
    }

    return index * (slideWidth.value + wrapperGap.value)
  }

  const translateX = computed(() => {
    const baseTranslateX = getTranslateByIndex(activeIndex.value)
    const nextTranslateX = baseTranslateX - dragOffset.value

    if (isLoop.value) return nextTranslateX

    return Math.min(Math.max(nextTranslateX, 0), maxTranslateX.value)
  })

  const containerStyle = computed(() => {
    const style = {
      transform: `translate3d(-${translateX.value}px, 0, 0)`,
      transitionDuration: isTransitioning.value && !isDragging.value ? `${speed.value}ms` : '0ms',
    }

    if (slidesPerView.value !== 'auto' && slideWidth.value) {
      style.width = `${
        slideWidth.value * displayData.value.length +
        wrapperGap.value * Math.max(displayData.value.length - 1, 0)
      }px`
    }

    return style
  })

  const slideSizeStyle = computed(() => {
    if (slidesPerView.value === 'auto') return null

    // 已量到容器寬度：用精確 px
    if (slideWidth.value) {
      return {
        width: `${slideWidth.value}px`,
        flexBasis: `${slideWidth.value}px`,
      }
    }

    // SSR / 尚未量到容器寬度時的 fallback：先用 slidesPerView 以 CSS calc 算欄寬，
    // 避免套到 .m-swiper-slide 預設的 w-full 而出現「先單欄、ready 後才多欄」的閃動。
    // gap 以容器 column-gap 為準（--m-swiper-gap，預設 0px），量到寬度後即被上方精確值取代。
    const visibleGapCount = Math.max(slidesPerView.value - 1, 0)
    const fallbackWidth = `calc((100% - ${visibleGapCount} * var(--m-swiper-gap, 0px)) / ${slidesPerView.value})`

    return {
      width: fallbackWidth,
      flexBasis: fallbackWidth,
    }
  })

  const slideStyle = computed(() => {
    return slideSizeStyle.value
  })

  const configSignature = computed(() => {
    return JSON.stringify({
      device: device.value,
      dataLength: props.data.length,
      loop: Boolean(swiperConfig.value.loop),
      autoplay: autoplayConfig.value,
      nav: Boolean(navConfig.value),
      pagination: Boolean(paginationConfig.value),
      autoWidth: Boolean(swiperConfig.value.autoWidth),
      slidesPerView: slidesPerView.value,
      initialSlide: swiperConfig.value.initialSlide,
      loopAdditionalSlides: loopAdditionalSlides.value,
      speed: speed.value,
      touchThreshold: touchThreshold.value,
    })
  })

  const api = computed(() => {
    return {
      activeIndex: activeIndex.value,
      realIndex: realIndex.value,
      slideTo: onSlideToCore,
      slidePrev: onPrev,
      slideNext: onNext,
    }
  })

  const emitChange = () => {
    emits('change', api.value)
  }

  const stopAutoplay = () => {
    clearTimeout(autoplayTimer.value)
    autoplayTimer.value = null
  }

  const getSlideAutoplayDelay = (index = activeIndex.value) => {
    if (!import.meta.client) return null

    const slide = containerRef.value?.children?.[index]
    const delay = parseInt(slide?.getAttribute?.('data-swiper-autoplay'), 10)

    return !Number.isNaN(delay) && delay > 0 ? delay : null
  }

  const getAutoplayDelay = () => {
    return getSlideAutoplayDelay() ?? autoplayConfig.value.delay
  }

  const requestFrame = (callback) => {
    if (!import.meta.client) {
      callback()
      return
    }

    window.requestAnimationFrame(callback)
  }

  const setClientTimeout = (callback, delay = 0) => {
    if (!import.meta.client) return null

    return window.setTimeout(callback, delay)
  }

  const clearResizeRefreshTimer = () => {
    if (!resizeRefreshTimer.value) return

    window.clearTimeout(resizeRefreshTimer.value)
    resizeRefreshTimer.value = null
  }

  const getSrcsetUrl = (srcset) => {
    return srcset?.split(',')?.[0]?.trim()?.split(/\s+/)?.[0] || null
  }

  const loadVisibleSlideImages = () => {
    if (!import.meta.client || !wrapperRef.value || !containerRef.value) return

    const wrapperRect = wrapperRef.value.getBoundingClientRect()
    const slides = Array.from(containerRef.value.children || [])

    slides.forEach((slide) => {
      const slideRect = slide.getBoundingClientRect()
      const isVisible =
        slideRect.right > wrapperRect.left &&
        slideRect.left < wrapperRect.right &&
        slideRect.bottom > wrapperRect.top &&
        slideRect.top < wrapperRect.bottom

      if (!isVisible) return

      slide.querySelectorAll('picture').forEach((picture) => {
        const img = picture.querySelector('img')

        if (!img) return

        const source = Array.from(picture.querySelectorAll('source')).find((item) => {
          return !item.media || window.matchMedia(item.media).matches
        })
        const sourceUrl = getSrcsetUrl(source?.getAttribute('srcset'))

        if (sourceUrl) {
          img.setAttribute('src', sourceUrl)
        }
      })
    })
  }

  const refreshSlidesRender = () => {
    renderKey.value += 1
  }

  const notifySwiperUpdate = () => {
    if (!import.meta.client) return

    requestFrame(() => {
      window.dispatchEvent(new Event('m-swiper-update'))
      loadVisibleSlideImages()
    })
  }

  const runAutoplay = (delayForce) => {
    if (!import.meta.client) return
    if (!autoplay.running || !autoplayConfig.value) return

    let delay = delayForce

    if (typeof delay === 'undefined') {
      delay = getAutoplayDelay()
    }

    autoplayTimeLeft.value = delay

    const proceed = async () => {
      if (!autoplay.running || !autoplayConfig.value) return

      const moved = autoplayConfig.value.reverseDirection
        ? await onSlideAutoplayPrev()
        : await onSlideAutoplayNext()

      if (!moved) return

      pauseAutoplay(true, true)
    }

    if (delay > 0) {
      stopAutoplay()
      autoplayTimer.value = setClientTimeout(proceed, delay)
      return
    }

    requestFrame(proceed)
  }

  const jumpTo = async (index) => {
    isTransitioning.value = false

    await nextTick()

    containerRef.value?.getBoundingClientRect()
    activeIndex.value = index

    await nextTick()

    if (!import.meta.client) {
      isTransitioning.value = true
      return
    }

    containerRef.value?.getBoundingClientRect()

    await new Promise((resolve) => {
      requestFrame(() => {
        isTransitioning.value = true
        notifySwiperUpdate()
        resolve()
      })
    })
  }

  const normalizeLoopEdge = async (direction) => {
    if (!isLoop.value || !props.data.length) return

    const beforeFirstCloneEdge = direction === 'prev' && activeIndex.value <= 0
    const afterLastCloneEdge = direction === 'next' && activeIndex.value >= maxIndex.value

    if (beforeFirstCloneEdge) {
      await jumpTo(activeIndex.value + props.data.length)
      return
    }

    if (afterLastCloneEdge) {
      await jumpTo(activeIndex.value - props.data.length)
    }
  }

  const onSlideToCore = (index, shouldEmit = true) => {
    if (!props.data.length) return

    activeIndex.value = getActiveIndexByRealIndex(getRealIndexByInitialSlide(index))
    notifySwiperUpdate()

    if (shouldEmit) {
      emitChange()
    }
  }

  const onSlideTo = (index) => {
    onSlideToCore(index)
    onAutoplayInteraction()
  }

  const onSlideToRealIndex = (index, shouldEmit = true) => {
    if (!props.data.length) return

    activeIndex.value = getActiveIndexByRealIndex(index)
    notifySwiperUpdate()

    if (shouldEmit) {
      emitChange()
    }
  }

  const onPrev = async (isUserInteraction = true) => {
    if (!props.data.length) return

    if (!isLoop.value && activeIndex.value <= 0) return

    await normalizeLoopEdge('prev')

    activeIndex.value -= 1
    notifySwiperUpdate()
    emitChange()

    if (isUserInteraction) {
      onAutoplayInteraction()
    }
  }

  const onNext = async (isUserInteraction = true) => {
    if (!props.data.length) return

    if (!isLoop.value && activeIndex.value >= maxIndex.value) return

    await normalizeLoopEdge('next')

    activeIndex.value += 1
    notifySwiperUpdate()
    emitChange()

    if (isUserInteraction) {
      onAutoplayInteraction()
    }
  }

  const onSlideAutoplayPrev = async () => {
    if (!isLoop.value && activeIndex.value <= 0) {
      if (autoplayConfig.value?.stopOnLastSlide) {
        stopAutoplayAll()
        return false
      }

      activeIndex.value = maxIndex.value
      notifySwiperUpdate()
      emitChange()
      return true
    }

    await onPrev(false)
    return true
  }

  const onSlideAutoplayNext = async () => {
    if (!isLoop.value && activeIndex.value >= maxIndex.value) {
      if (autoplayConfig.value?.stopOnLastSlide) {
        stopAutoplayAll()
        return false
      }

      activeIndex.value = 0
      notifySwiperUpdate()
      emitChange()
      return true
    }

    await onNext(false)
    return true
  }

  const startAutoplay = () => {
    if (!import.meta.client) return
    if (!autoplayConfig.value) {
      stopAutoplayAll()
      return
    }

    autoplayStartTime.value = Date.now()
    autoplay.running = true
    autoplay.paused = false
    runAutoplay()
  }

  const stopAutoplayAll = () => {
    autoplay.running = false
    autoplay.paused = false
    stopAutoplay()
    containerRef.value?.removeEventListener('transitionend', onAutoplayTransitionEnd)
  }

  const pauseAutoplay = (internal = false, reset = false) => {
    if (!autoplay.running || !autoplayConfig.value) return

    stopAutoplay()

    if (!internal) {
      pausedByInteraction.value = true
    }

    autoplay.paused = true

    const proceed = () => {
      if (autoplayConfig.value.waitForTransition && speed.value > 0) {
        containerRef.value?.addEventListener('transitionend', onAutoplayTransitionEnd)
        return
      }

      resumeAutoplay()
    }

    if (reset) {
      proceed()
      return
    }

    const delay = autoplayTimeLeft.value || autoplayConfig.value.delay
    autoplayTimeLeft.value = delay - (Date.now() - autoplayStartTime.value)

    if (autoplayTimeLeft.value < 0) {
      autoplayTimeLeft.value = 0
    }

    proceed()
  }

  const resumeAutoplay = () => {
    if (!autoplay.running || !autoplayConfig.value) return

    autoplayStartTime.value = Date.now()

    if (pausedByInteraction.value) {
      pausedByInteraction.value = false
      runAutoplay(autoplayTimeLeft.value)
    } else {
      runAutoplay()
    }

    autoplay.paused = false
  }

  const resetAutoplay = () => {
    if (!autoplay.running || !autoplayConfig.value) return

    pausedByInteraction.value = false
    autoplay.paused = false
    autoplayStartTime.value = Date.now()
    runAutoplay()
  }

  const onAutoplayTransitionEnd = (event) => {
    if (event?.target && event.target !== containerRef.value) return

    containerRef.value?.removeEventListener('transitionend', onAutoplayTransitionEnd)

    if (pausedByPointerEnter.value) return

    resumeAutoplay()
  }

  const onAutoplayInteraction = () => {
    if (!autoplayConfig.value || !autoplay.running) return

    if (autoplayConfig.value.disableOnInteraction) {
      stopAutoplayAll()
      return
    }

    pauseAutoplay(true, true)
  }

  const onAutoplayTouchMove = () => {
    if (!autoplayConfig.value || !autoplay.running || isTouched.value) return

    isTouched.value = true

    if (autoplayConfig.value.disableOnInteraction) {
      stopAutoplayAll()
      return
    }

    stopAutoplay()
    autoplay.paused = true
    pausedByInteraction.value = true
  }

  const onAutoplayTouchEnd = (hasSlideChanged) => {
    if (!isTouched.value) return

    isTouched.value = false

    if (!autoplayConfig.value || !autoplay.running) return
    if (autoplayConfig.value.disableOnInteraction) return

    if (hasSlideChanged) {
      pauseAutoplay(true, true)
      return
    }

    resumeAutoplay()
  }

  const resetIndex = async () => {
    isTransitioning.value = false
    activeIndex.value = initialIndex.value

    await nextTick()

    if (!import.meta.client) {
      isTransitioning.value = true
      return
    }

    requestFrame(() => {
      isTransitioning.value = true
      notifySwiperUpdate()
    })
  }

  const updateSlider = async () => {
    await nextTick()

    containerWidth.value = wrapperRef.value?.clientWidth || 0
    wrapperGap.value =
      import.meta.client && containerRef.value
        ? Number.parseFloat(window.getComputedStyle(containerRef.value).columnGap) || 0
        : 0

    if (!isLoop.value && activeIndex.value > maxIndex.value) {
      activeIndex.value = maxIndex.value
    }

    notifySwiperUpdate()
  }

  const updateSliderKeepIndex = async () => {
    const currentRealIndex = realIndex.value

    await updateSlider()

    if (isLoop.value) {
      isTransitioning.value = false
      activeIndex.value = currentRealIndex + cloneCount.value

      await nextTick()

      requestFrame(() => {
        isTransitioning.value = true
        notifySwiperUpdate()
      })

      return
    }

    activeIndex.value = Math.min(currentRealIndex, maxIndex.value)
    notifySwiperUpdate()
  }

  const scheduleResizeRefresh = () => {
    if (!import.meta.client) return

    clearResizeRefreshTimer()

    requestFrame(async () => {
      await updateSliderKeepIndex()
      loadVisibleSlideImages()

      resizeRefreshTimer.value = setClientTimeout(async () => {
        await updateSliderKeepIndex()
        loadVisibleSlideImages()
        resizeRefreshTimer.value = null
      }, 120)
    })
  }

  const onWindowResize = async () => {
    if (!import.meta.client) return

    const currentDevice = device.value

    onResize()
    await updateSliderKeepIndex()
    scheduleResizeRefresh()

    if (device.value !== currentDevice) return

    if (isLoop.value) {
      return
    }

    if (activeIndex.value > maxIndex.value) {
      activeIndex.value = maxIndex.value
    }
  }

  const onTransitionEnd = (event) => {
    if (event?.target && event.target !== containerRef.value) return

    if (isLoop.value && props.data.length) {
      notifySwiperUpdate()
    }
  }

  const onPaginationClick = (index) => {
    if (!paginationConfig.value?.clickable) return

    onSlideToRealIndex(index)
    onAutoplayInteraction()
  }

  const onMouseEnter = () => {
    if (autoplayConfig.value?.pauseOnMouseEnter) {
      pausedByInteraction.value = true
      pausedByPointerEnter.value = true
      pauseAutoplay(true)
    }
  }

  const onMouseLeave = () => {
    if (autoplayConfig.value?.pauseOnMouseEnter) {
      pausedByPointerEnter.value = false

      if (autoplay.paused) {
        resetAutoplay()
      }
    }
  }

  const getPointerClientX = (event) => {
    return event.touches?.[0]?.pageX ?? event.clientX ?? 0
  }

  const getPointerClientY = (event) => {
    return event.touches?.[0]?.pageY ?? event.clientY ?? 0
  }

  const isInteractiveElement = (target) => {
    return Boolean(
      target?.closest?.(
        'button, input, textarea, select, label, summary, [role="button"], [contenteditable="true"]'
      )
    )
  }

  const isDragEnabled = computed(() => {
    const rawDraggable = props.config?.draggable

    if (rawDraggable === false) return false

    if (hasResponsiveConfig(rawDraggable)) {
      const currentDevice = device.value
      const isExplicit =
        currentDevice in rawDraggable ||
        ('pt' in rawDraggable && ['p', 't'].includes(currentDevice)) ||
        ('tm' in rawDraggable && ['t', 'm'].includes(currentDevice))

      if (isExplicit && !resolveResponsiveConfig(rawDraggable)) return false
    }

    if (isLoop.value) return true
    return maxTranslateX.value > 0
  })

  const onPointerStart = (event) => {
    if (!props.data.length) return
    if (!isDragEnabled.value) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.pointerType === 'mouse' && isInteractiveElement(event.target)) return

    pointerStartX.value = getPointerClientX(event)
    pointerStartY.value = getPointerClientY(event)
    pointerCurrentX.value = pointerStartX.value
    pointerCurrentY.value = pointerStartY.value
    activePointerId.value = event.pointerId ?? null
    dragOffset.value = 0
    isDragging.value = true
    isTransitioning.value = false
    movedByTouch.value = false
    allowClick.value = true
  }

  const onPointerMove = (event) => {
    if (!isDragging.value) return
    if (activePointerId.value !== null && event.pointerId !== activePointerId.value) return

    pointerCurrentX.value = getPointerClientX(event)
    pointerCurrentY.value = getPointerClientY(event)

    const movedX = pointerCurrentX.value - pointerStartX.value
    const movedY = pointerCurrentY.value - pointerStartY.value

    if (Math.abs(movedY) > Math.abs(movedX)) {
      return
    }

    if (Math.abs(movedX) > 5) {
      allowClick.value = false
      onAutoplayTouchMove()

      if (event.cancelable) {
        event.preventDefault()
      }
    }

    dragOffset.value = movedX
  }

  const onPointerEnd = async (event) => {
    if (!isDragging.value) return
    if (activePointerId.value !== null && event.pointerId !== activePointerId.value) return

    const movedX = pointerCurrentX.value - pointerStartX.value

    isDragging.value = false
    isTransitioning.value = true
    activePointerId.value = null
    dragOffset.value = 0

    if (allowClick.value) {
      return
    }

    if (Math.abs(movedX) > touchThreshold.value) {
      allowClick.value = false
      movedByTouch.value = true

      if (movedX > 0) {
        await onPrev(false)
      } else {
        await onNext(false)
      }
    }

    onAutoplayTouchEnd(movedByTouch.value)
    movedByTouch.value = false

    setClientTimeout(() => {
      allowClick.value = true
    })
  }

  const onClickCapture = (event) => {
    if (allowClick.value) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    allowClick.value = true
  }

  const getSlotIndex = (index) => {
    if (!isLoop.value) return index

    return (index - cloneCount.value + props.data.length) % props.data.length
  }

  const getSlideAutoplayAttr = (item) => {
    if (!item || typeof item !== 'object') return null

    return (
      item.dataSwiperAutoplay ??
      item.data_swiper_autoplay ??
      item.swiperAutoplay ??
      item.SwiperAutoplay ??
      null
    )
  }

  const registerGroup = () => {
    swiperGroup?.register(swiperName.value, {
      prev: onPrev,
      next: onNext,
      slideTo: onSlideTo,
      isBeginning,
      isEnd,
      isLoop,
    })
  }

  let isConfigInitialized = false

  watch(
    () => configSignature.value,
    async () => {
      if (!import.meta.client) return

      const savedRealIndex = isConfigInitialized ? realIndex.value : null
      isConfigInitialized = true

      stopAutoplayAll()
      await updateSlider()
      refreshSlidesRender()

      if (savedRealIndex === null) {
        await resetIndex()
      } else {
        isTransitioning.value = false
        activeIndex.value = getActiveIndexByRealIndex(
          Math.min(Math.max(savedRealIndex, 0), Math.max(props.data.length - 1, 0))
        )

        await nextTick()

        requestFrame(() => {
          isTransitioning.value = true
          notifySwiperUpdate()
        })
      }

      await nextTick()
      startAutoplay()
    },
    {
      immediate: true,
    }
  )

  onMounted(async () => {
    registerGroup()
    onResize()
    await updateSlider()
    await resetIndex()
    startAutoplay()
    loadVisibleSlideImages()

    containerRef.value?.addEventListener('transitionend', onTransitionEnd)
    if ('ResizeObserver' in window) {
      resizeObserver.value = new ResizeObserver(() => {
        scheduleResizeRefresh()
      })
      resizeObserver.value.observe(wrapperRef.value)
    }
    document.addEventListener('pointermove', onPointerMove, { passive: false, capture: true })
    document.addEventListener('pointerup', onPointerEnd, { passive: true, capture: true })
    document.addEventListener('pointercancel', onPointerEnd, { passive: true, capture: true })
    document.addEventListener('pointerleave', onPointerEnd, { passive: true, capture: true })
    window.addEventListener('resize', onWindowResize)
  })

  onUnmounted(() => {
    stopAutoplayAll()
    clearResizeRefreshTimer()
    resizeObserver.value?.disconnect()
    swiperGroup?.unregister(swiperName.value)
    containerRef.value?.removeEventListener('transitionend', onTransitionEnd)
    document.removeEventListener('pointermove', onPointerMove, { capture: true })
    document.removeEventListener('pointerup', onPointerEnd, { capture: true })
    document.removeEventListener('pointercancel', onPointerEnd, { capture: true })
    document.removeEventListener('pointerleave', onPointerEnd, { capture: true })
    window.removeEventListener('resize', onWindowResize)
  })

  return {
    wrapperRef,
    displayData,
    getSlideAutoplayAttr,
    getSlotIndex,
    renderKey,
    slideStyle,
    navConfig,
    onClickCapture,
    onMouseEnter,
    onMouseLeave,
    onNext,
    onPaginationClick,
    onPointerStart,
    onPrev,
    onSlideTo,
    paginationConfig,
    paginationLength,
    realIndex,
    setClass,
    swiperName,
    containerRef,
    containerStyle,
    isDragEnabled,
    isBeginning,
    isEnd,
  }
}
