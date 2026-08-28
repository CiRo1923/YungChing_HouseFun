<script setup>
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import homeIcon from '@/assets/imgs/buy/house/poi/home.svg'

const buyHouse = useBuyHouseStore()
const { basic } = storeToRefs(buyHouse)
const runtimeConfig = useRuntimeConfig()

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeID: {
    type: String,
    default: null,
  },
  source: {
    type: Object,
    default: () => {},
  },
})

let hasSetGoogleMapsOptions = false

const mapRef = ref(null)
const selectedPlaceID = ref(null)
const isMapReady = ref(false)
const mapError = ref('')
const geocodedHomePosition = ref(null)

let map = null
let infoWindow = null
let homeMarker = null
let markers = []
let mapListeners = []
let hasFittedMarkers = false
let homeGeocodePromise = null

const MARKER_SIZE = 32
const MARKER_COLLISION_PADDING = 5
const CLUSTER_PIXEL_DISTANCE = MARKER_SIZE + MARKER_COLLISION_PADDING * 2
// POI marker(.poi-map-marker--poi)的視覺尺寸,marker 以座標點為中心繪製
const POI_MARKER_SIZE = 30
// InfoWindow 箭頭 tip 與 marker 之間要保留的間距
const INFO_WINDOW_GAP = 5
// 箭頭三角形(::after height 20px)實際 tip 超出預設錨點往下延伸的量
const INFO_WINDOW_TAIL_OVERHANG = 6
// 上移「半個 marker + 間距 + 箭頭下伸量」,箭頭 tip 才會落在 marker 上方 5px 處
const INFO_WINDOW_OFFSET_Y = -(POI_MARKER_SIZE / 2 + INFO_WINDOW_GAP + INFO_WINDOW_TAIL_OVERHANG)

// 統一的縮放層級:home 一律置於地圖正中央,不論容器大小或分類 POI 分布,
// 初次進入與切換 tab 都套用此縮放,維持相同的地圖尺寸與中心。
const HOME_CENTER_ZOOM = 16

const homeAddress = computed(
  () =>
    basic.value?.homeAddress ??
    props.source?.homeAddress ??
    basic.value?.address ??
    props.source?.address ??
    ''
)

const activeItem = computed(() => props.items.find((item) => item.id === props.activeID) ?? null)

const places = computed(() => activeItem.value?.data.map(normalizePlace) ?? [])
const placesWithPosition = computed(() => places.value.filter((item) => item.position))
const homePosition = computed(
  () => getCoordinates(props.source) ?? getCoordinates(basic.value) ?? geocodedHomePosition.value
)
const fallbackCenter = computed(
  () => homePosition.value ?? placesWithPosition.value[0]?.position ?? null
)

// 覆蓋在地圖上的提示訊息:優先顯示錯誤,其次是無座標資料的空狀態
const overlayMessage = computed(() => {
  if (mapError.value) {
    return mapError.value
  }

  if (placesWithPosition.value.length === 0 && !homePosition.value) {
    return '此分類目前沒有可顯示在地圖上的座標資料'
  }

  return ''
})

const toNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

// 依序回傳第一個可轉為有效數字的值,全部無效則為 null
const firstNumber = (...values) => {
  for (const value of values) {
    const number = toNumber(value)

    if (number !== null) {
      return number
    }
  }

  return null
}

// 依序回傳第一個非空(排除 undefined / null / '')的值,全部為空則為 ''
const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? ''

const getCoordinates = (data) => {
  if (!data || typeof data !== 'object') {
    return null
  }

  const lat = firstNumber(data.lat, data.latitude, data.mapLat, data.y, data.position?.lat)
  const lng = firstNumber(
    data.lng,
    data.lon,
    data.longitude,
    data.mapLng,
    data.x,
    data.position?.lng
  )

  if (lat === null || lng === null) {
    return null
  }

  return { lat, lng }
}

const getPlaceName = (data) => firstValue(data?.name, data?.title, data?.label) || '生活機能'

const getPlaceDistance = (data) => {
  const walkMin = firstValue(data?.walkMin, data?.walkingMinute, data?.walkMinute)
  const distance = firstValue(data?.distanceText, data?.distanceMeter)
  const distanceText = typeof distance === 'number' ? `${distance} 公尺` : String(distance)

  if (distanceText && walkMin) {
    return `${distanceText}，約 ${walkMin} 分鐘`
  }

  return distanceText || (walkMin ? `約 ${walkMin} 分鐘` : '')
}

const normalizePlace = (data, index) => {
  const position = getCoordinates(data)

  return {
    id: data?.id ?? data?.placeId ?? `${props.activeID}-${index}`,
    name: getPlaceName(data),
    address: data?.address ?? data?.addr ?? '',
    distance: getPlaceDistance(data),
    position,
    raw: data,
  }
}

const ensureGoogleMaps = async () => {
  if (!import.meta.client) {
    return Promise.reject(new Error('Google Maps 只能在瀏覽器載入'))
  }

  if (window.google?.maps) {
    if (!window.google.maps.Geocoder) {
      await importLibrary('geocoding')
    }

    return Promise.resolve(window.google.maps)
  }

  if (window.__housefunGoogleMapsPromise) {
    return window.__housefunGoogleMapsPromise
  }

  const apiKey = runtimeConfig.public.googleMapsApiKey

  if (!apiKey) {
    return Promise.reject(new Error('缺少 Google Maps API Key'))
  }

  if (!hasSetGoogleMapsOptions) {
    hasSetGoogleMapsOptions = true
    setOptions({
      key: apiKey,
      language: 'zh-TW',
      region: 'TW',
    })
  }

  window.__housefunGoogleMapsPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('geocoding'),
  ]).then(() => window.google.maps)

  return window.__housefunGoogleMapsPromise
}

const geocodeHomeAddress = async () => {
  if (homePosition.value || !homeAddress.value || !window.google?.maps?.Geocoder) {
    return homePosition.value
  }

  if (homeGeocodePromise) {
    return homeGeocodePromise
  }

  homeGeocodePromise = new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode(
      {
        address: homeAddress.value,
        region: 'TW',
      },
      (results, status) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null)
          return
        }

        const location = results[0].geometry.location
        const position = {
          lat: location.lat(),
          lng: location.lng(),
        }

        geocodedHomePosition.value = position
        resolve(position)
      }
    )
  })

  return homeGeocodePromise
}

const clearMarkers = () => {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

const clearMapListeners = () => {
  mapListeners.forEach((listener) => listener.remove())
  mapListeners = []
}

const getProjectedPixel = (position) => {
  const projection = map?.getProjection?.()
  const zoom = map?.getZoom?.()

  if (!projection || zoom === undefined) {
    return null
  }

  const point = projection.fromLatLngToPoint(
    new window.google.maps.LatLng(position.lat, position.lng)
  )
  const scale = 2 ** zoom

  return {
    x: point.x * scale,
    y: point.y * scale,
  }
}

const isMarkerCollision = (a, b) =>
  Math.abs(a.x - b.x) <= CLUSTER_PIXEL_DISTANCE && Math.abs(a.y - b.y) <= CLUSTER_PIXEL_DISTANCE

const getClusterCenter = (places) => {
  const total = places.reduce(
    (result, place) => ({
      lat: result.lat + place.position.lat,
      lng: result.lng + place.position.lng,
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: total.lat / places.length,
    lng: total.lng / places.length,
  }
}

const getClusteredPlaces = () => {
  if (!map?.getProjection?.()) {
    return placesWithPosition.value.map((place) => ({
      id: place.id,
      places: [place],
      position: place.position,
    }))
  }

  const items = placesWithPosition.value.map((place) => ({
    place,
    pixel: getProjectedPixel(place.position),
  }))
  const visited = new Set()
  const clusters = []

  items.forEach((item, index) => {
    if (visited.has(index)) {
      return
    }

    const queue = [index]
    const groupIndexes = []
    visited.add(index)

    while (queue.length > 0) {
      const currentIndex = queue.shift()
      const current = items[currentIndex]
      groupIndexes.push(currentIndex)

      items.forEach((candidate, candidateIndex) => {
        if (
          visited.has(candidateIndex) ||
          !current.pixel ||
          !candidate.pixel ||
          !isMarkerCollision(current.pixel, candidate.pixel)
        ) {
          return
        }

        visited.add(candidateIndex)
        queue.push(candidateIndex)
      })
    }

    const places = groupIndexes.map((groupIndex) => items[groupIndex].place)

    clusters.push({
      id: places.map((place) => place.id).join('_'),
      places,
      position: getClusterCenter(places),
    })
  })

  return clusters
}

const createInfoContent = (place) => {
  const distance = place.distance
    ? `<p class="poi-map-info__distance mt-[2px] text-[13px] font-medium text-[--white]">${place.distance}</p>`
    : ''

  return `
    <div class="poi-map-info min-w-[125px] max-w-[220px] px-[12px] py-[15px] text-left leading-[1.64] text-[--white] text-[14px] ">
      <strong class="block">${place.name}</strong>
      ${distance}
    </div>
  `
}

// marker 共用底樣式(以座標點為中心繪製,故 translate -50%)
const MARKER_BASE_CLASS =
  'absolute inline-flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center text-[--white] transition-[background-color] duration-300'

// 各類型 marker 的外觀設定:className 為必填,html / text 擇一決定內容
const MARKER_VARIANTS = {
  home: {
    className: `${MARKER_BASE_CLASS} h-[32px] w-[32px] h-full max-w-full`,
    html: () => `<img src="${homeIcon}" width="100%" height="100%" alt="" aria-hidden="true" />`,
  },
  poi: {
    className: `${MARKER_BASE_CLASS} h-[30px] w-[30px] rounded-full bg-[--green-7b1c] text-[14px] hover:bg-[--gray-2338] [&.--active]:bg-[--gray-2338]`,
    text: (label) => label,
  },
}

const createButtonOverlayMarker = ({
  position,
  label,
  title,
  type = 'poi',
  zIndex = 1,
  pixelOffset = { x: 0, y: 0 },
  onClick,
}) => {
  const googleMaps = window.google.maps
  const variant = MARKER_VARIANTS[type] ?? MARKER_VARIANTS.poi

  class ButtonOverlayMarker extends googleMaps.OverlayView {
    constructor() {
      super()
      this.position = position
      this.pixelOffset = pixelOffset
      this.button = null
      this.isActive = false
    }

    onAdd() {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = variant.className
      button.title = title
      button.setAttribute('aria-label', title)

      if (variant.html) {
        button.innerHTML = variant.html()
      } else {
        button.textContent = variant.text(label)
      }

      button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick?.()
      })

      button.style.zIndex = String(zIndex)
      button.classList.toggle('--active', this.isActive)
      this.button = button
      this.getPanes().overlayMouseTarget.appendChild(button)
    }

    draw() {
      if (!this.button) {
        return
      }

      const point = this.getProjection().fromLatLngToDivPixel(
        new googleMaps.LatLng(this.position.lat, this.position.lng)
      )

      if (!point) {
        return
      }

      this.button.style.left = `${point.x + this.pixelOffset.x}px`
      this.button.style.top = `${point.y + this.pixelOffset.y}px`
    }

    onRemove() {
      this.button?.remove()
      this.button = null
    }

    setActive(isActive) {
      this.isActive = isActive
      this.button?.classList.toggle('--active', isActive)
    }

    setPixelOffset(value) {
      this.pixelOffset = value
      this.draw()
    }
  }

  const marker = new ButtonOverlayMarker()
  marker.setMap(map)

  return marker
}

const refreshMarkerPositions = () => {
  homeMarker?.draw?.()
  markers.forEach((marker) => marker.draw?.())
}

const rebuildMarkersForCurrentZoom = () => {
  if (!map || !window.google?.maps) {
    return
  }

  renderMarkers({ shouldFit: false, shouldAutoOpen: false })
}

const scheduleMarkerRebuild = () => {
  window.requestAnimationFrame(() => {
    rebuildMarkersForCurrentZoom()
  })
}

const onMapBoundsChanged = () => {
  refreshMarkerPositions()
}

const onMapIdle = () => {
  rebuildMarkersForCurrentZoom()
  refreshMarkerPositions()
}

const onMapZoomChanged = () => {
  // 縮放時移除先前點擊開啟的 popup(InfoWindow),並取消該 marker 的選取高亮
  selectedPlaceID.value = null
  infoWindow?.close()
  updateMarkerActiveState()
  scheduleMarkerRebuild()
}

const onMapDragStart = () => {
  // 使用者拖動地圖時關閉 popup(InfoWindow)並取消該 marker 的選取高亮
  // panTo 等程式移動不會觸發 dragstart,不會誤關
  selectedPlaceID.value = null
  infoWindow?.close()
  updateMarkerActiveState()
}

const bindMapPositionListeners = () => {
  if (!map || mapListeners.length !== 0) {
    return
  }

  mapListeners = [
    map.addListener('bounds_changed', onMapBoundsChanged),
    map.addListener('zoom_changed', onMapZoomChanged),
    map.addListener('dragstart', onMapDragStart),
    map.addListener('idle', onMapIdle),
  ]
}

const updateMarkerActiveState = () => {
  if (!window.google?.maps) {
    return
  }

  markers.forEach((marker) => {
    marker.setActive(marker.__placeIDs?.includes(selectedPlaceID.value) ?? false)
  })
}

const openPlace = (place) => {
  if (!map || !place?.position) {
    return
  }

  const marker = markers.find((item) => item.__placeIDs?.includes(place.id))

  selectedPlaceID.value = place.id
  updateMarkerActiveState()
  map.panTo(place.position)

  if (marker && infoWindow) {
    infoWindow.setContent(createInfoContent(place))
    infoWindow.setPosition(place.position)
    infoWindow.open({ map })
  }
}

const fitVisibleMarkers = () => {
  if (!map || !window.google?.maps) {
    return
  }

  // home 一律置於地圖正中央,並套用統一縮放層級,
  // 讓「初次進入 / 切換 tab」不論容器大小、POI 分布都維持相同的地圖尺寸與中心。
  if (homePosition.value) {
    map.setCenter(homePosition.value)
    map.setZoom(HOME_CENTER_ZOOM)

    return
  }

  // 無 home 座標的退路:置中於第一個 POI,縮放仍維持統一層級
  const firstPlace = placesWithPosition.value[0]

  if (firstPlace) {
    map.setCenter(firstPlace.position)
    map.setZoom(HOME_CENTER_ZOOM)
  }
}

const renderHomeMarker = () => {
  if (!map || !homePosition.value) {
    return
  }

  homeMarker?.setMap(null)
  homeMarker = createButtonOverlayMarker({
    position: homePosition.value,
    title: homeAddress.value || basic.value?.title || '物件位置',
    type: 'home',
    zIndex: 10,
  })
}

const renderMarkers = ({ shouldFit = !hasFittedMarkers, shouldAutoOpen = false } = {}) => {
  if (!map || !window.google?.maps) {
    return
  }

  clearMarkers()

  getClusteredPlaces().forEach((cluster) => {
    if (cluster.places.length > 1) {
      const label = String(cluster.places.length)
      const title = `${cluster.places.length} 個地點`
      const marker = createButtonOverlayMarker({
        position: cluster.position,
        title,
        label,
        zIndex: 2,
        onClick: () => {
          selectedPlaceID.value = null
          infoWindow?.close()
          map.panTo(cluster.position)
          map.setZoom((map.getZoom() ?? 15) + 1)
          renderMarkers({ shouldFit: false, shouldAutoOpen: false })
        },
      })

      marker.__placeIDs = cluster.places.map((place) => place.id)
      markers.push(marker)
      return
    }

    const place = cluster.places[0]
    const marker = createButtonOverlayMarker({
      position: place.position,
      title: place.name,
      label: '1',
      zIndex: 2,
      onClick: () => openPlace(place),
    })

    marker.__placeIDs = [place.id]
    markers.push(marker)
  })

  // 重建後統一套用選取狀態(涵蓋單點與群集 marker)
  updateMarkerActiveState()

  if (shouldFit) {
    fitVisibleMarkers()
    hasFittedMarkers = true
  }

  if (shouldAutoOpen && !selectedPlaceID.value && placesWithPosition.value[0]) {
    window.setTimeout(() => openPlace(placesWithPosition.value[0]), 0)
  }
}

const onInit = async () => {
  if (!mapRef.value) {
    return
  }

  try {
    mapError.value = ''
    await ensureGoogleMaps()
    await geocodeHomeAddress()

    if (!fallbackCenter.value) {
      return
    }

    map =
      map ??
      new window.google.maps.Map(mapRef.value, {
        center: fallbackCenter.value,
        zoom: HOME_CENTER_ZOOM,
        clickableIcons: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        ],
      })

    infoWindow =
      infoWindow ??
      new window.google.maps.InfoWindow({
        pixelOffset: new window.google.maps.Size(0, INFO_WINDOW_OFFSET_Y),
      })
    bindMapPositionListeners()
    renderHomeMarker()

    isMapReady.value = true
    renderMarkers()
  } catch (error) {
    mapError.value = error.message
  }
}

watch(
  placesWithPosition,
  () => {
    selectedPlaceID.value = null
    hasFittedMarkers = false
    infoWindow?.close()

    if (!map) {
      onInit()
      return
    }

    renderMarkers()
  },
  { deep: true }
)

watch(homeAddress, () => {
  geocodedHomePosition.value = null
  homeGeocodePromise = null

  if (mapRef.value) {
    onInit()
  }
})

onMounted(() => {
  onInit()
})

onBeforeUnmount(() => {
  clearMapListeners()
  clearMarkers()
  homeMarker?.setMap(null)
  infoWindow?.close()
})

// 地圖可放大的上限(避免無止境放大)
const MAX_FOCUS_ZOOM = 20

// 計算「讓某 POI 從群集中獨立出來」所需的最小整數 zoom;無法計算時回傳 null。
// 群集判定為 Chebyshev 像素距離 ≤ CLUSTER_PIXEL_DISTANCE,像素距離 = 世界座標距離 × 2^zoom,
// 故需 2^zoom > CLUSTER_PIXEL_DISTANCE / 最近鄰的世界座標距離。
const getZoomToIsolatePlace = (place) => {
  const projection = map?.getProjection?.()

  if (!projection) {
    return null
  }

  const toPoint = (position) =>
    projection.fromLatLngToPoint(new window.google.maps.LatLng(position.lat, position.lng))
  const target = toPoint(place.position)

  let minWorldDistance = Infinity

  placesWithPosition.value.forEach((other) => {
    if (other.id === place.id) {
      return
    }

    const point = toPoint(other.position)
    const distance = Math.max(Math.abs(point.x - target.x), Math.abs(point.y - target.y))

    if (distance < minWorldDistance) {
      minWorldDistance = distance
    }
  })

  if (!Number.isFinite(minWorldDistance) || minWorldDistance === 0) {
    return null
  }

  return Math.ceil(Math.log2(CLUSTER_PIXEL_DISTANCE / minWorldDistance))
}

// 放大到足以拆開群集後,等 marker 重建完成(idle)再開啟該 POI
const zoomInToIsolatePlace = (place) => {
  const currentZoom = map.getZoom() ?? HOME_CENTER_ZOOM
  const targetZoom = getZoomToIsolatePlace(place) ?? currentZoom + 2
  const nextZoom = Math.min(Math.max(targetZoom, currentZoom + 1), MAX_FOCUS_ZOOM)

  const listener = map.addListener('idle', () => {
    listener.remove()
    openPlace(place)
  })

  map.panTo(place.position)
  map.setZoom(nextZoom)
}

// 供父層(ItemsAnchor 清單)點擊時,觸發與點擊地圖 POI marker 相同的行為;
// 若該 POI 目前被群集折疊,先放大拆開再開啟。
const onFocusPlace = (index) => {
  const place = places.value[index]

  if (!place?.position) {
    return
  }

  const marker = markers.find((item) => item.__placeIDs?.includes(place.id))
  const isClustered = (marker?.__placeIDs?.length ?? 0) > 1

  if (isClustered) {
    zoomInToIsolatePlace(place)
    return
  }

  openPlace(place)
}

defineExpose({
  onFocusPlace,
})
</script>

<template>
  <div class="tm:h-[380px] p:h-[420px]" ref="mapRef" />
  <div
    v-if="overlayMessage"
    class="flex h-full w-full items-center justify-center bg-[--gray-f7] text-[14px]"
  >
    {{ overlayMessage }}
  </div>
  <div
    v-else-if="!isMapReady"
    class="flex h-full w-full items-center justify-center bg-[--gray-f7] text-[14px]"
  >
    地圖載入中
  </div>
</template>

<style lang="postcss">
/* 以下皆為 Google Maps 注入的內部 DOM(.gm-*),無法掛 class,只能用 CSS 覆蓋 */
.gm-style .gm-style-iw-c:has(.poi-map-info) {
  padding: 0;
  border-radius: 5px;
  background: var(--gray-2338);
  box-shadow: none;
}

.gm-style .gm-style-iw-d:has(.poi-map-info) {
  overflow: hidden !important;
}

.gm-style .gm-style-iw-c:has(.poi-map-info) + .gm-style-iw-tc {
  filter: none;
}

.gm-style .gm-style-iw-c:has(.poi-map-info) + .gm-style-iw-tc::after {
  width: 30px;
  height: 20px;
  background: var(--gray-2338);
}

.gm-style .gm-style-iw-c:has(.poi-map-info) .gm-ui-hover-effect {
  display: none !important;
}

/* 隱藏關閉鈕所在的表頭列,移除深色框上方多餘的空白 */
.gm-style .gm-style-iw-c:has(.poi-map-info) .gm-style-iw-chr {
  display: none !important;
}
</style>
