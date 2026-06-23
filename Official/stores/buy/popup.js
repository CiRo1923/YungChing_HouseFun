import { defineStore } from 'pinia'

export const useBuyPopupStore = defineStore('buyPopup', () => {
  const buttons = readonly({
    alert: [
      {
        id: 'sure',
        label: '確認',
        class: '--bg-orange-f74c --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        id: 'cancel',
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        id: 'sure',
        label: '確認',
        class: '--bg-green-6a2d --text-white',
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
