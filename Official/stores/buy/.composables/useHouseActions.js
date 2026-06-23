import { apiBuyHouse } from '@js/_api/buy/house.js'

import { useBuyHouseStore } from '@stores/buy/house.js'

const useBuyHouseStores = () => {
  const buyHouseStores = useBuyHouseStore()
  const route = useRoute()

  const onApiBuyHouse = async () => {
    const { params } = route
    const { config, status, data } = await apiBuyHouse({
      hfid: params.hfid,
    })

    if (status === 200) {
      // key: store 欄位, value: 取不到資料時的預設值
      const SECTION_DEFAULTS = {
        breadcrumb: [],
        basic: {},
        badges: {},
        pricing: {},
        media: {},
        floor: {},
        community: {},
        parking: {},
        pin: {},
        actualPrice: {},
        broker: {},
        poi: {},
        highlights: {},
      }

      buyHouseStores.$patch({
        detail: data,
        ...Object.fromEntries(
          Object.entries(SECTION_DEFAULTS).map(([key, fallback]) => [key, data[key] ?? fallback])
        ),
        agentPick: data.recommend?.agentPick ?? {},
        hotForYou: data.recommend?.hotForYou ?? {},
      })
    }

    return { config, status, data }
  }

  return {
    onApiBuyHouse,
  }
}

export default useBuyHouseStores
