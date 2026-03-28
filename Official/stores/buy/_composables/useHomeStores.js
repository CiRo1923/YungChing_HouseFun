import { apiRegion, apiMrt } from '@js/_api/common.js'
import { apiBuyList } from '@js/_api/buy/basic.js'

import { useHomeStore } from '@stores/buy/home.js'

const useHomeStores = () => {
  // const projectStores = useProjectStore()
  const homeStores = useHomeStore()
  const route = useRoute()
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { content, mode, region, mrt, purpose, price, room, info, pagination } =
    storeToRefs(homeStores)

  const onApiRegion = async () => {
    if (region.value) return false

    const { config, status, data } = await apiRegion()

    if (status === 200) {
      region.value = data
    }

    return { config, status, data }
  }

  const onApiMrt = async () => {
    if (mrt.value) return false

    const { config, status, data } = await apiMrt()

    if (status === 200) {
      mrt.value = data
    }

    return { config, status, data }
  }

  const onApiBuyList = async (params) => {
    const { config, status, data } = await apiBuyList({
      ...params,
      purpose: purpose.value.value ? `${purpose.value.value}_purpose` : '',
      price: price.value.value ? `${price.value.value}_price` : '',
      room: room.value.value ? `${room.value.value}_room` : '',
      tab: info.value.active,
      pg: route.query.pg,
      pageSize: 12,
    })

    if (status === 200) {
      const { items, tabs, paging } = data
      const infoMap = info.value.items.map((item) => {
        const value = tabs?.[item.id] ?? item.value ?? 0
        const templateLabel = item.templateLabel ?? item.label

        return {
          ...item,
          templateLabel: templateLabel,
          label: templateLabel.replace('{{ value }}', value),
        }
      })

      content.value = items
      info.value.items = infoMap
      pagination.value = paging
    }

    return { config, status, data }
  }

  const onModeClick = (value) => {
    if (mode.value === value) return

    mode.value = value
  }

  return {
    onApiRegion,
    onApiMrt,
    onApiBuyList,
    onModeClick,
  }
}

export default useHomeStores
