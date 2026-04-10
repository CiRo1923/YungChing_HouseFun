import { apiBuyHouse } from '@js/_api/buy/basic.js'

import { useBuyHouseStore } from '@stores/buy/house.js'

const useBuyHouseStores = () => {
  // const projectStores = useProjectStore()
  const houseStores = useBuyHouseStore()
  const route = useRoute()
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const {
    detail,
    breadcrumb,
    basic,
    pricing,
    media,
    floor,
    community,
    parking,
    pin,
    actualPrice,
    broker,
    poi,
  } = storeToRefs(houseStores)

  const onApiBuyHouse = async () => {
    const { params } = route
    const { config, status, data } = await apiBuyHouse({
      hfid: params.hfid,
    })

    if (status === 200) {
      detail.value = data

      breadcrumb.value = data.breadcrumb || []
      basic.value = data.basic || {}
      pricing.value = data.pricing || {}
      media.value = data.media || {}
      floor.value = data.floor || {}
      community.value = data.community || {}
      parking.value = data.parking || {}
      pin.value = data.pin || {}
      actualPrice.value = data.actualPrice || {}
      broker.value = data.broker || {}
      poi.value = data.poi || {}
      // console.log(data)
    }

    return { config, status, data }
  }

  return {
    onApiBuyHouse,
  }
}

export default useBuyHouseStores
