import { apiRegion, apiMrt } from '@js/_api/buy/common.js'
import { apiBuyList, apiBuyListFocus, apiBuySuggest } from '@js/_api/buy/list.js'
import { onResolveByDevice } from '@js/_projectPrototype.js'

export default () => {
  const commonStore = useCommonStore()
  const { device } = storeToRefs(commonStore)
  const buyProjectStores = useBuyProjectStore()
  // channel 已移至 buyProject store,onChannel 仍在此設定,判斷 computed 由 useBuyProjectActions 提供
  const { channel } = storeToRefs(buyProjectStores)
  const buyListStore = useBuyListStore()
  const {
    focus,
    content,
    region,
    mrt,
    purpose,
    price,
    room,
    type,
    pin,
    parking,
    age,
    floor,
    unitPrice,
    face,
    nearBy,
    keyword,
    tab,
    pagination,
  } = storeToRefs(buyListStore)
  const { onApiError } = usePopupActions()
  const { onSetSeo } = useCommonActions()
  const { isChannelRegion, isChannelMrt, onSaveChannel } = useBuyProjectActions()
  const { onValueGetText } = useManageActions()
  const route = useRoute()
  const commonParams = computed(() => {
    const paramsPurpose = content.value.apiData.purpose
      ? `${content.value.apiData.purpose}_purpose`
      : ''
    const paramsPrice = content.value.apiData.price ? `${content.value.apiData.price}_price` : ''
    const paramsRoom = content.value.apiData.room ? `${content.value.apiData.room}_room` : ''
    const paramsType = content.value.apiData.type ? `${content.value.apiData.type}_type` : ''
    const paramsPin = content.value.apiData[pin.value.type]
      ? `${content.value.apiData[pin.value.type]}_${pin.value.type}`
      : ''
    const paramsParkingMode = content.value.apiData.parking
      ? `${content.value.apiData.parking}_parking`
      : ''
    const paramsAge = content.value.apiData.age ? `${content.value.apiData.age}_age` : ''
    const paramsFloor = content.value.apiData.floor ? `${content.value.apiData.floor}_floor` : ''
    const paramsUnitPrice = content.value.apiData.uniprice
      ? `${content.value.apiData.uniprice}_uniprice`
      : ''
    const paramsFace = content.value.apiData.dt ? `${content.value.apiData.dt}_dt` : ''
    const paramsNearBy = content.value.apiData.ft ? `${content.value.apiData.ft}_ft` : ''
    // tab(降價 / 新上架 / 實境):預設 0(全部)不帶段;放最後與 infoMap 的 _tab 位置一致,
    // 讓搜尋 / 切換頻道重組 URL 時保留當前分頁,不會被清掉。
    const paramsTab = content.value.apiData.tab ? `${content.value.apiData.tab}_tab` : ''

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
    if (paramsTab) result.push(paramsTab)

    return result
  })
  const commonQuery = computed(() => {
    const queryOd = content.value.apiData.od ? { od: content.value.apiData.od } : {}
    const queryTag =
      content.value.apiData.tag.length !== 0 ? { tag: content.value.apiData.tag.join(',') } : {}
    // 關鍵字寫入 URL(query),重整 / 分享後才能還原
    const queryKw = content.value.apiData.kw ? { kw: content.value.apiData.kw } : {}

    return {
      ...queryOd,
      ...queryTag,
      ...queryKw,
    }
  })
  // 區間字串 → 文字:-X → 「X 以下」;X- → 「X 以上」;X-Y → 「X - Y」。
  const onRangeText = (value, unit) => {
    const [min, max] = String(value).split('-')

    if (min && max) return `${min} - ${max} ${unit}`
    if (max) return `${max} ${unit}以下`
    if (min) return `${min} ${unit}以上`

    return ''
  }

  // 房數字串 → 文字:單一值用選項 label(含「房」);範圍為「min - max 房」(比照 Room.vue)。
  const onRoomText = (value) => {
    const [minStr, maxStr] = String(value).split('-')
    const min = Number(minStr)
    const max = maxStr != null && maxStr !== '' ? Number(maxStr) : min

    return min === max
      ? room.value.options.find((item) => item.value === max)?.label || String(max)
      : `${min} - ${max} ${room.value.unit}`
  }

  // 縣市 / 區域:ids 拆成多項 { label, value }(2碼=縣市、5碼=區域)。condition / label / 移除共用。
  const onRegionItems = (ids) => {
    const list = region.value.options || []
    const idList = ids ? ids.split(',') : []

    return idList
      .map((id) => {
        let city = null
        let area = null

        if (id.length === 2) city = list.find((item) => item.id === id)
        if (id.length === 5) {
          for (const item of list) {
            const found = (item.areas || []).find((areaItem) => areaItem.id === id)
            if (found) {
              city = item
              area = found
              break
            }
          }
        }

        const label = area ? `${city?.name}-${area.name}` : city?.name

        return label ? { label, value: id } : null
      })
      .filter(Boolean)
  }

  // 捷運:ids 拆項(2碼=區域、4碼=線、>4碼=站),label 比照 mrt 下拉。
  const onMrtItems = (ids) => {
    const list = mrt.value.options || []
    const idList = ids ? ids.split(',') : []

    return idList
      .map((id) => {
        let area = null
        let line = null
        let station = null

        if (id.length === 2) area = list.find((item) => item.id === id)
        if (id.length === 4) {
          for (const item of list) {
            const found = (item.lines || []).find((lineItem) => lineItem.id === id)
            if (found) {
              area = item
              line = found
              break
            }
          }
        }
        if (id.length > 4) {
          for (const item of list) {
            const found = (item.lines || []).find((lineItem) =>
              (lineItem.stations || []).some((stationItem) => stationItem.id === id)
            )
            if (found) {
              area = item
              line = found
              station = found.stations.find((stationItem) => stationItem.id === id)
              break
            }
          }
        }

        const label = station?.name
          ? station.name
          : line?.name
            ? line.name
            : area?.name
              ? `${area.name}全線`
              : null

        return label ? { label, value: id } : null
      })
      .filter(Boolean)
  }

  // ids → 顯示 label(多組以「、」串接),供下拉按鈕於移除 / 重置後同步顯示。
  const onRegionLabel = (ids) =>
    onRegionItems(ids)
      .map((item) => item.label)
      .join('、')
  const onMrtLabel = (ids) =>
    onMrtItems(ids)
      .map((item) => item.label)
      .join('、')

  // 搜尋條件:一律以「網址(route)」為準 → 只有按搜尋(URL 改變)才更新,
  // 不受下拉即時勾選(content.apiData / label / ids 皆為 v-model,勾選當下就變)影響。
  // 回傳 [{ label, value }] 陣列(縣市 / 區域 / 捷運多組會拆開)。
  const condition = computed(() => {
    const parsed = onParseFilters(route)

    // 區域與捷運互斥,只會有一個 channel;各自把 route 上的選取拆成多項並標記 key
    const channelItems = isChannelRegion.value
      ? onRegionItems(parsed.region || region.value.defaultIDs).map((item) => ({
          ...item,
          key: 'region',
        }))
      : isChannelMrt.value
        ? onMrtItems(parsed.mrt || mrt.value.defaultIDs).map((item) => ({ ...item, key: 'mrt' }))
        : []

    // 用途 / 總價 / 房數:由 route 值還原 label(空 → 顯示 defaultLabel)
    const purposeLabel = parsed.purpose
      ? onValueGetText('casePurpose', parsed.purpose)
      : onResolveByDevice(purpose.value.defaultLabel, device.value)
    const priceLabel = parsed.price
      ? onRangeText(parsed.price, price.value.unit)
      : onResolveByDevice(price.value.defaultLabel, device.value)
    const roomLabel = parsed.room
      ? onRoomText(parsed.room)
      : onResolveByDevice(room.value.defaultLabel, device.value)

    return [
      ...channelItems,
      { label: purposeLabel, value: parsed.purpose ?? '', key: 'purpose' },
      { label: priceLabel, value: parsed.price ?? '', key: 'price' },
      { label: roomLabel, value: parsed.room ?? '', key: 'room' },
    ]
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
      mrt.value.options = items.map((item) => ({
        ...item,
        lines: item.lines.map((lines) => ({
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
      purpose: content.value.apiData.purpose,
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
    const { query } = targetRoute
    const { config, status, data } = await apiBuyList({
      ...(isChannelRegion.value ? { region: region.value.ids || region.value.all } : {}),
      ...(isChannelMrt.value ? { mrt: mrt.value.ids || mrt.value.all } : {}),
      ...content.value.apiData,
      pg: query.pg,
      pageSize: 20,
    })

    if (status === 200) {
      const { items, tabs, paging, seo: seoData } = data
      // tab 只更新數量;不給 `to`,避免變成 router-link「點擊即導航」。
      // tab 改為純選取(Category onClick 設 content.apiData.tab),按搜尋時經 commonParams 套用,
      // 與其他篩選條件一致,避免「點 tab 打一次 + 搜尋再打一次」的重複請求。
      const infoMap = tab.value.options.map((item) => ({
        ...item,
        count: tabs?.[item.id] ?? item.value ?? 0,
      }))

      content.value.data = items
      onSetSeo(seoData)
      tab.value.options = infoMap
      pagination.value = paging
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiBuySuggest = async () => {
    const { kw, region } = content.value.apiData
    const { config, status, data } = await apiBuySuggest({
      kw,
      region,
      limit: null,
    })

    if (status === 200) {
      const { items } = data
      keyword.value.options = items
    } else {
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
    // channel 一改變即存 storage,供明細頁 reload 後還原
    onSaveChannel()
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
    content.value.apiData.purpose = parseFilters.purpose || ''

    // price
    content.value.apiData.price = parseFilters.price || ''

    // room
    content.value.apiData.room = parseFilters.room || ''

    // type
    content.value.apiData.type = parseFilters.type || ''

    // pin
    const pinTypes = ['buildpin', 'usepin', 'landpin']

    pinTypes.forEach((type) => {
      if (parseFilters[type]) {
        pin.value.type = type
        content.value.apiData[type] = parseFilters[type]
      }
    })

    // parkingMode
    content.value.apiData.parking = parseFilters.parking || ''

    // age
    content.value.apiData.age = parseFilters.age || ''

    // floor
    content.value.apiData.floor = parseFilters.floor || ''

    // unitPrice
    content.value.apiData.uniprice = parseFilters.uniprice || ''

    // face
    content.value.apiData.dt = parseFilters.dt || ''

    // nearBy
    content.value.apiData.ft = parseFilters.ft || ''

    // tab
    content.value.apiData.tab = Number(parseFilters.tab) || tab.value.defaultID

    // tag
    content.value.apiData.tag = parseFilters.tag?.split(',') ?? []

    // kw(從 URL query 還原關鍵字)
    content.value.apiData.kw = parseFilters.kw || ''

    // od(排序以 querystring 帶入網址,重整 / 分享後還原)
    content.value.apiData.od = parseFilters.od || ''
  }
  // 重置搜尋:清空所有篩選值與 label,回到 store 預設(區域 / 捷運回預設 id)。
  // 導回預設列表由呼叫端負責(router.push),此處只還原 store 狀態。
  const onResetSearch = () => {
    content.value.apiData = { ...buyListStore.apiDefault.content }

    // 區域 / 捷運:id 回預設,label 由 helper 依 ids 重算。
    // 路由切換不會重跑各下拉的 onInit,故 label 一律直接設定;設空字串會露出 placeholder。
    region.value.ids = region.value.defaultIDs
    region.value.label = onRegionLabel(region.value.defaultIDs)
    mrt.value.ids = mrt.value.defaultIDs
    mrt.value.label = onMrtLabel(mrt.value.defaultIDs)

    // 純 label 型篩選:label 設回 defaultLabel(非空,避免下拉顯示 placeholder)
    ;[purpose, type, parking, face, nearBy, pin].forEach((item) => {
      item.value.label = onResolveByDevice(item.value.defaultLabel, device.value)
    })

    // 區間型篩選:label 回 defaultLabel,清 range / min / max
    ;[price, room, age, floor, unitPrice].forEach((item) => {
      item.value.label = onResolveByDevice(item.value.defaultLabel, device.value)
      if ('range' in item.value) item.value.range = []
      item.value.min = null
      item.value.max = null
    })
  }

  // 移除單一搜尋條件:依 condition 回傳項的 { key, value } 還原對應篩選。
  // 區域 / 捷運 → 從 ids 逗號清單移除該筆(移光回預設);用途 / 總價 / 房數 → 清空。
  // 只改 store 狀態(含 label 同步,避免下拉露 placeholder),實際套用由呼叫端 router.push 觸發。
  const onRemoveCondition = ({ key, value } = {}) => {
    const onRemoveId = (target, labelFn) => {
      const next = (target.value.ids ? target.value.ids.split(',') : []).filter(
        (id) => id !== value
      )
      target.value.ids = next.join(',') || target.value.defaultIDs
      target.value.label = labelFn(target.value.ids)
    }

    const onClearLabel = (target) => {
      target.value.label = onResolveByDevice(target.value.defaultLabel, device.value)

      if ('range' in target.value) target.value.range = []
      if ('min' in target.value) target.value.min = null
      if ('max' in target.value) target.value.max = null
    }

    switch (key) {
      case 'region':
        onRemoveId(region, onRegionLabel)
        break
      case 'mrt':
        onRemoveId(mrt, onMrtLabel)
        break
      case 'purpose':
        content.value.apiData.purpose = ''
        onClearLabel(purpose)
        break
      case 'price':
        content.value.apiData.price = ''
        onClearLabel(price)
        break
      case 'room':
        content.value.apiData.room = ''
        onClearLabel(room)
        break
    }
  }

  return {
    isChannelRegion,
    isChannelMrt,
    commonParams,
    commonQuery,
    condition,
    onApiRegion,
    onApiMrt,
    onApiBuyList,
    onApiBuyListFocus,
    onApiBuySuggest,
    onChannel,
    onParseFilters,
    onGetBuyListParams,
    onResetSearch,
    onRemoveCondition,
  }
}
