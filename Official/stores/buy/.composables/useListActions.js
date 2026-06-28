import { apiRegion, apiMrt } from '@js/_api/common.js'
import { apiBuyList, apiBuyListFocus, apiBuySuggest } from '@js/_api/buy/list.js'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyPopupActions from '@stores/buy/.composables/usePopupActions.js'

const useBuyListStores = () => {
  // const projectStores = useProjectStore()
  const buyListStore = useBuyListStore()
  const { channel, focus, content, apiSearchData, region, mrt, pin, tab, pagination } =
    storeToRefs(buyListStore)
  const { onApiError } = useBuyPopupActions()
  const route = useRoute()
  const isChannelRegion = computed(() => channel.value === 'region')
  const isChannelMrt = computed(() => channel.value === 'mrt')
  const commonParams = computed(() => {
    const paramsPurpose = apiSearchData.value.purpose
      ? `${apiSearchData.value.purpose}_purpose`
      : ''
    const paramsPrice = apiSearchData.value.price ? `${apiSearchData.value.price}_price` : ''
    const paramsRoom = apiSearchData.value.room ? `${apiSearchData.value.room}_room` : ''
    const paramsType = apiSearchData.value.type ? `${apiSearchData.value.type}_type` : ''
    const paramsPin = apiSearchData.value[pin.value.type]
      ? `${apiSearchData.value[pin.value.type]}_${pin.value.type}`
      : ''
    const paramsParkingMode = apiSearchData.value.parking
      ? `${apiSearchData.value.parking}_parking`
      : ''
    const paramsAge = apiSearchData.value.age ? `${apiSearchData.value.age}_age` : ''
    const paramsFloor = apiSearchData.value.floor ? `${apiSearchData.value.floor}_floor` : ''
    const paramsUnitPrice = apiSearchData.value.uniprice
      ? `${apiSearchData.value.uniprice}_uniprice`
      : ''
    const paramsFace = apiSearchData.value.dt ? `${apiSearchData.value.dt}_dt` : ''
    const paramsNearBy = apiSearchData.value.ft ? `${apiSearchData.value.ft}_ft` : ''

    const result = []

    if (paramsPurpose) result.push(paramsPurpose)
    if (paramsPrice) result.push(paramsPrice)
    if (paramsRoom) result.push(paramsRoom)
    if (paramsType) result.push(paramsType)
    if (paramsPin) result.push(paramsPin)
    if (paramsParkingMode) result.push(paramsParkingMode)
    if (paramsAge) result.push(paramsAge)
    if (paramsFloor) result.push(paramsFloor)
    if (paramsUnitPrice) result.push(paramsUnitPrice)
    if (paramsFace) result.push(paramsFace)
    if (paramsNearBy) result.push(paramsNearBy)

    return result
  })
  const commonQuery = computed(() => {
    const queryOd = apiSearchData.value.od ? { od: apiSearchData.value.tag } : {}
    const queryTag =
      apiSearchData.value.tag.length !== 0 ? { tag: apiSearchData.value.tag.join(',') } : {}

    return {
      ...queryOd,
      ...queryTag,
    }
  })
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)

  const onApiRegion = async () => {
    if (region.value.options) return false

    const { config, status, data } = await apiRegion()

    if (status === 200) {
      const { items } = data

      region.value.all = items.map((item) => item.id).join(',')
      region.value.options = items.map((city) => ({
        ...city,
        areas: [{ id: city.id, name: '全區' }, ...city.areas],
      }))
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiMrt = async () => {
    if (mrt.value.options) return false

    const { config, status, data } = await apiMrt()

    if (status === 200) {
      const { items } = data

      mrt.value.all = items.map((item) => item.id).join(',')
      mrt.value.options = items.map((mrt) => ({
        ...mrt,
        lines: mrt.lines.map((lines) => ({
          ...lines,
          stations: [{ id: lines.id, name: '全站' }, ...lines.stations],
        })),
      }))
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiBuyListFocus = async () => {
    const { config, status, data } = await apiBuyListFocus({
      purpose: apiSearchData.value.purpose,
      ...(isChannelRegion.value ? { region: region.value.ids || region.value.all } : {}),
      ...(isChannelMrt.value ? { mrt: mrt.value.ids || mrt.value.all } : {}),
    })

    if (status === 200) {
      // console.log(data)
      focus.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiBuyList = async (targetRoute = route) => {
    const { params, query } = targetRoute
    const { config, status, data } = await apiBuyList({
      ...(isChannelRegion.value ? { region: region.value.ids || region.value.all } : {}),
      ...(isChannelMrt.value ? { mrt: mrt.value.ids || mrt.value.all } : {}),
      ...apiSearchData.value,
      pg: query.pg,
      pageSize: 12,
    })

    if (status === 200) {
      const { items, tabs, paging } = data
      const infoMap = tab.value.options.map((item) => {
        const value = tabs?.[item.id] ?? item.value ?? 0
        const filters = params.filters.filter((item) => !item.includes('_tab'))
        const to = {
          name: buyListStore.basicRouteName,
          params: {
            filters: [...filters, ...(item.value ? [`${item.value}_tab`] : [])],
          },
          query: {
            pg: 1,
          },
        }

        return {
          ...item,
          count: value,
          to,
        }
      })

      content.value = items
      tab.value.options = infoMap
      pagination.value = paging
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiBuySuggest = async () => {
    const { kw, region } = apiSearchData.value
    const { config, status, data } = await apiBuySuggest({
      kw,
      region,
      limit: null,
    })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onChannel = (targetRoute = route) => {
    const filters = targetRoute.params.filters
    const list = Array.isArray(filters) ? filters : filters ? [filters] : []
    const hasRegion = !!list.find((item) => /region/.test(item))
    const hasMrt = !!list.find((item) => /mrt/.test(item))

    channel.value = hasRegion ? 'region' : hasMrt ? 'mrt' : ''
  }
  const onParseFilters = (targetRoute = route) => {
    const { filters } = targetRoute.params
    const list = Array.isArray(filters) ? filters : filters ? [filters] : []

    // 路徑 filters 為 value_key 字串陣列；解析成 { key: value }
    const parsed = list.reduce((acc, item) => {
      const str = String(item)
      const index = str.lastIndexOf('_')

      if (index === -1) return acc

      const value = str.slice(0, index)
      const key = str.slice(index + 1)

      if (!key) return acc

      acc[key] = value
      return acc
    }, {})

    // query (例如 tag、pg) 已是 { key: value } 物件，一併合併
    return { ...parsed, ...targetRoute.query }
  }

  const onGetBuyListParams = (targetRoute = route) => {
    const parseFilters = onParseFilters(targetRoute)

    // region
    region.value.ids = (isChannelRegion.value && parseFilters.region) || region.value.defaultIDs

    // mrt
    mrt.value.ids = (isChannelMrt.value && parseFilters.mrt) || mrt.value.defaultIDs

    // purpose
    apiSearchData.value.purpose = parseFilters.purpose || ''

    // price
    apiSearchData.value.price = parseFilters.price || ''

    // room
    apiSearchData.value.room = parseFilters.room || ''

    // type
    apiSearchData.value.type = parseFilters.type || ''

    // pin
    const pinTypes = ['buildpin', 'usepin', 'landpin']

    pinTypes.forEach((type) => {
      if (parseFilters[type]) {
        pin.value.type = type
        apiSearchData.value[type] = parseFilters[type]
      }
    })

    // parkingMode
    apiSearchData.value.parking = parseFilters.parking || ''

    // age
    apiSearchData.value.age = parseFilters.age || ''

    // floor
    apiSearchData.value.floor = parseFilters.floor || ''

    // unitPrice
    apiSearchData.value.uniprice = parseFilters.uniprice || ''

    // face
    apiSearchData.value.dt = parseFilters.dt || ''

    // nearBy
    apiSearchData.value.ft = parseFilters.ft || ''

    // tab
    apiSearchData.value.tab = Number(parseFilters.tab) || tab.value.defaultID

    // tag
    apiSearchData.value.tag = parseFilters.tag?.split(',') ?? []
  }

  return {
    isChannelRegion,
    isChannelMrt,
    commonParams,
    commonQuery,
    onApiRegion,
    onApiMrt,
    onApiBuyList,
    onApiBuyListFocus,
    onApiBuySuggest,
    onChannel,
    onParseFilters,
    onGetBuyListParams,
  }
}

export default useBuyListStores
