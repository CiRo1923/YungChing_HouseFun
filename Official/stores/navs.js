import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', () => {
  const menu = readonly([
    {
      id: 'buy',
      label: '買屋',
      children: {
        submenu: [
          {
            label: '區域找房',
            to: {
              name: 'buy-region',
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
  ])

  return {
    menu,
  }
})
