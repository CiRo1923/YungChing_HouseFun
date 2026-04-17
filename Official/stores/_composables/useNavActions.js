import { useBuyListStore } from '@stores/buy/list.js'

const useNavStores = () => {
  const buyListStore = useBuyListStore()
  const { region, mrt } = storeToRefs(buyListStore)
  const menu = computed(() => {
    return [
      {
        id: 'buy',
        label: '買屋',
        children: {
          submenu: [
            {
              label: '區域找房',
              to: {
                name: buyListStore.basicRouteName,
                params: {
                  filters: [`${region.value.defaultApiData}_region`],
                },
                query: {
                  pg: 1,
                },
              },
            },
            {
              label: '捷運找房',
              to: {
                name: buyListStore.basicRouteName,
                params: {
                  filters: [`${mrt.value.defaultApiData}_mrt`],
                },
                query: {
                  pg: 1,
                },
              },
            },
          ],
        },
      },
      {
        id: 'community',
        label: '社區',
        to: {
          name: 'community',
        },
      },
      {
        id: 'newhouse',
        label: '新建案',
        to: {
          name: 'newhouse',
        },
      },
      {
        id: 'price',
        label: '實價登錄',
        to: {
          name: 'price',
        },
      },
      {
        id: 'rent',
        label: '租屋',
        to: {
          name: 'rent',
        },
      },
      {
        id: 'news',
        label: '新聞',
        to: {
          name: 'news',
        },
      },
    ]
  })

  return {
    menu,
  }
}

export default useNavStores
