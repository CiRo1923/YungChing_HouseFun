<script setup>
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const emits = defineEmits(['click'])
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

let map = null
let marker = null
let geocoder = null
let rafId = null
let requestId = 0
let currentAddress = ''

const runtimeConfig = useRuntimeConfig()
const mapRef = ref(null)
const config = computed(() => {
  return {
    defaultAddress: null,
    address: null,
    ...props.config,
  }
})
const configAddress = computed(() => {
  return config.value.address || config.value.defaultAddress || ''
})
const getAddressPart = (components, type) => {
  return components.find((item) => item.types.includes(type))?.long_name || ''
}

const getTaiwanDistrict = (components) => {
  const districtTypes = [
    'administrative_area_level_3',
    'sublocality_level_1',
    'sublocality_level_2',
    'locality',
  ]

  return (
    components.find((item) => {
      return (
        districtTypes.some((type) => item.types.includes(type)) &&
        /[區鄉鎮市]$/.test(item.long_name)
      )
    })?.long_name || ''
  )
}

const getTaiwanDistrictFromAddress = (address) => {
  return address.match(/(?:台灣)?(?:[^縣市]+[縣市])([^縣市區鄉鎮]+[區鄉鎮市])/)?.[1] || ''
}

const parseAddressParts = (result) => {
  const components = result?.address_components || []
  const formattedAddress = result?.formatted_address || ''
  const streetNumber = getAddressPart(components, 'street_number')
  const route = getAddressPart(components, 'route')
  const district = getTaiwanDistrict(components) || getTaiwanDistrictFromAddress(formattedAddress)
  const city =
    getAddressPart(components, 'administrative_area_level_1') ||
    getAddressPart(components, 'administrative_area_level_2')
  const addressAfterRoad = route ? formattedAddress.split(route).pop() || '' : formattedAddress
  const detailMatch = addressAfterRoad.match(/(?:(\d+)巷)?(?:(\d+)弄)?(?:(\d+)號)?/)
  const lane = detailMatch?.[1] || ''
  const alley = detailMatch?.[2] || ''
  const number = detailMatch?.[3] || streetNumber.replace(/號$/, '')

  return {
    address: formattedAddress,
    city,
    area: district,
    road: route,
    lane,
    alley,
    number,
  }
}

const emitAddressData = (result) => {
  const addressParts = parseAddressParts(result)

  emits('click', addressParts)

  return addressParts
}

const getBestAddress = (results) => {
  if (!results?.length) return null

  return (
    results.find((item) => item.types.includes('street_address')) ||
    results.find((item) => item.types.includes('premise')) ||
    results.find((item) => item.types.includes('establishment')) ||
    results.find((item) => item.types.includes('route')) ||
    results[0]
  )
}

const updateAddressByLocation = async ({ lat, lng }) => {
  if (!geocoder || !marker) return

  const currentRequestId = ++requestId

  try {
    const result = await geocoder.geocode({
      location: { lat, lng },
    })

    // 避免比較慢回來的舊請求覆蓋新結果
    if (currentRequestId !== requestId) return

    const bestResult = getBestAddress(result.results)

    if (!bestResult) {
      console.log('找不到地址')
      return
    }

    const addressParts = parseAddressParts(bestResult)
    const address = addressParts.address

    console.log('目前座標:', lat, lng)
    console.log('目前地址:', addressParts)

    currentAddress = address
    emits('click', addressParts)
    marker.position = { lat, lng }
  } catch (error) {
    console.error('反查地址失敗:', error)
  }
}

const updateAddressWithRaf = ({ lat, lng }) => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(() => {
    updateAddressByLocation({ lat, lng })
  })
}

const onListener = () => {
  if (!map) return

  // map.addListener('idle', () => {
  //   const newCenter = map.getCenter()

  //   if (!newCenter) return

  //   const lat = newCenter.lat()
  //   const lng = newCenter.lng()

  //   updateAddressWithRaf({ lat, lng })
  // })

  map.addListener('click', (e) => {
    if (!e.latLng) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    updateAddressWithRaf({ lat, lng })
  })
}

const updateMapByAddress = async (address) => {
  if (!geocoder || !map || !marker) return

  const queryAddress = address?.trim()

  if (queryAddress === currentAddress) return

  if (!queryAddress) {
    console.log('地址未設定，無法定位地圖')
    return
  }

  let result = null

  try {
    result = await geocoder.geocode({ address: queryAddress })
  } catch (error) {
    console.error('地址查詢失敗:', error)
    return
  }

  if (!result.results.length) {
    console.log('地址找不到')
    return
  }

  const location = result.results[0].geometry.location

  currentAddress = queryAddress
  emitAddressData(result.results[0])
  map.setCenter(location)
  marker.position = location
}

const onInit = async () => {
  if (!mapRef.value) return

  const apiKey = runtimeConfig.public.googleMapsApiKey?.trim()

  if (!apiKey) {
    console.error('Google Maps API key is not configured.')
    return
  }

  setOptions({
    key: apiKey,
    v: 'weekly',
  })

  const { Map } = await importLibrary('maps')
  const { Geocoder } = await importLibrary('geocoding')
  const { AdvancedMarkerElement } = await importLibrary('marker')

  geocoder = new Geocoder()
  const address = configAddress.value?.trim()

  if (!address) {
    console.log('地址未設定，無法初始化地圖')
    return
  }

  let result = null

  try {
    result = await geocoder.geocode({ address })
  } catch (error) {
    console.error('初始地址查詢失敗:', error)
    return
  }

  if (!result.results.length) {
    console.log('初始地址找不到')
    return
  }

  const location = result.results[0].geometry.location

  currentAddress = address
  emitAddressData(result.results[0])
  map = new Map(mapRef.value, {
    center: location,
    zoom: 18,
    mapId: 'DEMO_MAP_ID',
  })

  marker = new AdvancedMarkerElement({
    position: location,
    map,
  })
}

onMounted(async () => {
  await onInit()

  if (map && marker && geocoder) {
    onListener()
  }
})

watch(configAddress, (address) => {
  updateMapByAddress(address)
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<template>
  <div ref="mapRef" class="m-google-map w-full" />
</template>
