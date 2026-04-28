import { apiRegion, apiMrt } from '@js/_api/common.js'
import { apiBuyList } from '@js/_api/buy/basic.js'

import { useBuyListStore } from '@stores/buy/list.js'

const useBuyListStores = () => {
  // const projectStores = useProjectStore()
  const buyListStore = useBuyListStore()
  const { channel, content, mode, region, mrt, purpose, price, room, keyword, tab, pagination } =
    storeToRefs(buyListStore)
  const route = useRoute()
  const isChannelRegion = computed(() => channel.value === 'region')
  const isChannelMrt = computed(() => channel.value === 'mrt')
  const commonParams = computed(() => {
    const paramsPurpose = purpose.value.apiData ? `${purpose.value.apiData}_purpose` : ''
    const paramsPrice = price.value.apiData ? `${price.value.apiData}_price` : ''
    const paramsRoom = room.value.apiData ? `${room.value.apiData}_room` : ''
    const result = []

    if (paramsPurpose) result.push(paramsPurpose)
    if (paramsPrice) result.push(paramsPrice)
    if (paramsRoom) result.push(paramsRoom)

    return result
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

      // console.log(mrt.value)
    }

    return { config, status, data }
  }

  const onApiBuyList = async (targetRoute = route) => {
    const { params, query } = targetRoute
    const { config, status, data } = await apiBuyList({
      ...(isChannelRegion.value ? { region: region.value.apiData || region.value.all } : {}),
      ...(isChannelMrt.value ? { mrt: mrt.value.apiData || mrt.value.all } : {}),
      purpose: purpose.value.apiData || '',
      price: price.value.apiData || '',
      room: room.value.apiData || '',
      kw: keyword.value || '',
      tab: tab.value.apiData,
      pg: query.pg,
      pageSize: 12,
    })

    if (status === 200) {
      const { items, tabs, paging } = data
      const infoMap = tab.value.options.map((item) => {
        const value = tabs?.[item.id] ?? item.value ?? 0
        const templateLabel = item.templateLabel ?? item.label
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
        const label = Object.fromEntries(
          Object.entries(templateLabel).map(([key, str]) => [
            key,
            str.replace(/{{\s*value\s*}}/g, value),
          ])
        )

        return {
          ...item,
          templateLabel: templateLabel,
          label: label,
          to,
        }
      })

      content.value = items
      tab.value.options = infoMap
      pagination.value = paging
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
    const filters = targetRoute.params.filters
    const list = Array.isArray(filters) ? filters : filters ? [filters] : []

    return list.reduce((acc, item) => {
      const str = String(item)
      const index = str.lastIndexOf('_')

      if (index === -1) return acc

      const value = str.slice(0, index)
      const key = str.slice(index + 1)

      if (!key) return acc

      acc[key] = value
      return acc
    }, {})
  }

  const onGetBuyListParams = (targetRoute = route) => {
    const parseFilters = onParseFilters(targetRoute)

    console.log(parseFilters)

    // region
    region.value.apiData =
      (isChannelRegion.value && parseFilters.region) || region.value.defaultApiData

    // mrt
    mrt.value.apiData = (isChannelMrt.value && parseFilters.mrt) || mrt.value.defaultApiData

    // purpose
    purpose.value.apiData = parseFilters.purpose || ''

    // price
    price.value.apiData = parseFilters.price || ''

    // room
    room.value.apiData = parseFilters.room || ''

    // tab
    tab.value.apiData = Number(parseFilters.tab) || tab.value.defaultApiData
  }

  const onModeClick = (value) => {
    if (mode.value === value) return

    mode.value = value
  }

  return {
    isChannelRegion,
    isChannelMrt,
    commonParams,
    onApiRegion,
    onApiMrt,
    onApiBuyList,
    onChannel,
    onParseFilters,
    onGetBuyListParams,
    onModeClick,
  }
}

export default useBuyListStores
