import { apiBuyList } from '@js/buy/_api/basic.js'

import { toFixed } from '@js/_prototype.js'

import { useHomeStore } from '@stores/buy/home.js'

const useHomeStores = () => {
  // const projectStores = useProjectStore()
  const basicStores = useHomeStore()
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { content, pagination } = storeToRefs(basicStores)

  const onApiBuyList = async () => {
    const route = useRoute()
    const { params } = route
    const { config, status, data } = await apiBuyList({
      pg: params.page,
      pageSize: 12,
    })

    if (status === 200) {
      const { items, paging } = data
      // console.log(data)

      content.value = items
      pagination.value = paging
    }

    return { config, status, data }
  }

  return {
    onApiBuyList,
  }
}

export default useHomeStores
