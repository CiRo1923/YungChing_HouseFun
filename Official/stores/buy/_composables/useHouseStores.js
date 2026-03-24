import { apiBuyHouse } from '@js/buy/_api/basic.js'

import { useHouseStore } from '@stores/buy/house.js'

const useHouseStores = () => {
  // const projectStores = useProjectStore()
  const houseStores = useHouseStore()
  const route = useRoute()
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { detail, basic, pricing, media, floor, parking, pin, actualPrice, broker } =
    storeToRefs(houseStores)

  const onApiBuyHouse = async () => {
    const { params } = route
    const { config, status, data } = await apiBuyHouse({
      hfid: params.hfid,
    })

    if (status === 200) {
      detail.value = data

      basic.value = data.basic || {}
      pricing.value = data.pricing || {}
      media.value = data.media || {}
      floor.value = data.floor || {}
      parking.value = data.parking || {}
      pin.value = data.pin || {}
      actualPrice.value = data.actualPrice || {}
      broker.value = data.broker || {}
      // console.log(data)
    }

    return { config, status, data }
  }

  return {
    onApiBuyHouse,
  }
}

export default useHouseStores
