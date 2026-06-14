import { defineStore } from 'pinia'

export const useBuyPopupStore = defineStore('buyPopup', () => {
  const buttons = readonly({
    alert: [
      {
        id: 'sure',
        label: '確認',
        class: '--bg-orange-e646 --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        id: 'cancel',
        label: '取消',
        class: '--bg-gray-f2 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        id: 'sure',
        label: '確認',
        class: '--bg-orange-e646 --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })
  const setClass = readonly({
    alert: {
      main: 'p:--w-450 t:--w-300',
      content: 'text-center',
    },
    confirm: {
      main: 'p:--w-450 t:--w-300',
      content: 'text-center',
    },
  })

  return {
    buttons,
    setClass,
  }
})
