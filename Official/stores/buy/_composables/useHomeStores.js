import { apiBuyList } from '@js/buy/_api/basic.js'

import { useHomeStore } from '@stores/buy/home.js'

const useHomeStores = () => {
  // const projectStores = useProjectStore()
  const homeStores = useHomeStore()
  const route = useRoute()
  // const { apiData, options: projectOptions } = storeToRefs(projectStores)
  const { content, mode, info, pagination } = storeToRefs(homeStores)

  const onApiBuyList = async () => {
    const { params } = route
    const { config, status, data } = await apiBuyList({
      tab: info.value.active,
      pg: params.page,
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
    onApiBuyList,
    onModeClick,
  }
}

export default useHomeStores
