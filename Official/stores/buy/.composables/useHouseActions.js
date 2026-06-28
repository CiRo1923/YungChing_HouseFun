import { apiBuyHouse, apiBuyHousePoi } from '@js/_api/buy/house.js'

import { useBuyHouseStore } from '@stores/buy/house.js'

const useBuyHouseStores = () => {
  const buyHouseStores = useBuyHouseStore()
  const { lifeMap } = storeToRefs(buyHouseStores)
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
        broker: {},
        poi: {},
        highlights: {},
        features: {},
        actualPrice: {},
      }

      // 注意：$patch 用物件形式會對巢狀物件做 deep merge，
      // fallback 的空物件無法覆蓋上一筆資料，故改用 function 形式直接賦值取代。
      buyHouseStores.$patch((state) => {
        state.detail = data
        Object.entries(SECTION_DEFAULTS).forEach(([key, fallback]) => {
          state[key] = data[key] ?? fallback
        })
        state.agentPick = data.recommend?.agentPick ?? {}
        state.hotForYou = data.recommend?.hotForYou ?? {}
      })
    }

    return { config, status, data }
  }
  const onApiBuyHousePoi = async () => {
    const { params } = route
    const { config, status, data } = await apiBuyHousePoi({
      hfid: params.hfid,
    })

    if (status === 200) {
      lifeMap.value = data
      console.log(data)
    }

    return { config, status, data }
  }

  return {
    onApiBuyHouse,
    onApiBuyHousePoi,
  }
}

export default useBuyHouseStores
