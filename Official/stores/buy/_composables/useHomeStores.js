import { apiRegion, apiMrt } from '@js/_api/common.js'
import { apiBuyList } from '@js/_api/buy/basic.js'

import { useHomeStore } from '@stores/buy/home.js'

const useHomeStores = () => {
  // const projectStores = useProjectStore()
  const homeStores = useHomeStore()
  const route = useRoute()
  const isChannelRegion = computed(() => route.meta.channel === 'region')
  const isChannelMrt = computed(() => route.meta.channel === 'mrt')
  const commonQuery = computed(() => {
    return {
      ...(purpose.value.query ? { purpose: purpose.value.query } : {}),
      ...(price.value.query ? { price: price.value.query } : {}),
      ...(room.value.query ? { room: room.value.query } : {}),
    }
  })
  // tab 切換使用
  const tabQuery = computed(() => {
    // 在 region 要抓 mrt； 在 mrt 要抓 region
    return {
      ...(isChannelRegion.value && mrt.value.query ? { mrt: mrt.value.query } : {}),
      ...(isChannelMrt.value && region.value.query ? { region: region.value.query } : {}),
      ...commonQuery.value,
    }
  })
  // list 搜尋使用
  const listQuery = computed(() => {
    return {
      ...(isChannelRegion.value && region.value.query ? { region: region.value.query } : {}),
      ...(isChannelMrt.value && mrt.value.query ? { mrt: mrt.value.query } : {}),
      ...commonQuery.value,
    }
  })
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { content, mode, region, mrt, purpose, price, room, keyword, info, pagination } =
    storeToRefs(homeStores)

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

  const onApiBuyList = async () => {
    const { config, status, data } = await apiBuyList({
      ...(isChannelRegion.value ? { region: region.value.params || region.value.all } : {}),
      ...(isChannelMrt.value ? { mrt: mrt.value.params || mrt.value.all } : {}),
      purpose: purpose.value.params || '',
      price: price.value.params || '',
      room: room.value.params || '',
      kw: keyword.value || '',
      tab: info.value.active,
      pg: route.query.pg,
      pageSize: 12,
    })

    if (status === 200) {
      const { items, tabs, paging } = data
      const infoMap = info.value.items.map((item) => {
        const value = tabs?.[item.id] ?? item.value ?? 0
        const templateLabel = item.templateLabel ?? item.label
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
        }
      })

      content.value = items
      info.value.items = infoMap
      pagination.value = paging
    }

    return { config, status, data }
  }

  const onGetBuyListParams = () => {
    const { query } = route

    // region 有預設值 須等 query 有值才改變
    region.value.query = isChannelRegion.value && query.region ? query.region : region.value.query
    region.value.params = region.value.query

    // mrt 有預設值 須等 query 有值才改變
    mrt.value.query = isChannelMrt.value && query.mrt ? query.mrt : mrt.value.query
    mrt.value.params = mrt.value.query

    // purpose
    purpose.value.query = query.purpose || ''
    purpose.value.params = purpose.value.query

    // price
    price.value.query = query.price || ''
    price.value.params = price.value.query

    // room
    room.value.query = query.room || ''
    room.value.params = room.value.query
  }

  const onModeClick = (value) => {
    if (mode.value === value) return

    mode.value = value
  }

  return {
    isChannelRegion,
    isChannelMrt,
    tabQuery,
    listQuery,
    onApiRegion,
    onApiMrt,
    onApiBuyList,
    onGetBuyListParams,
    onModeClick,
  }
}

export default useHomeStores
