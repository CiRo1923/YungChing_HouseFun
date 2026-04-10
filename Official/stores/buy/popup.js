import { defineStore } from 'pinia'

export const useBuyPopupStore = defineStore('buyPopup', () => {
  const buttons = readonly({
    alert: [
      {
        label: '確認',
        class: '--bg-orange-e646 --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        label: '取消',
        class: '--bg-gray-f2 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        label: '確認',
        class: '--bg-orange-e646 --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })

  return {
    buttons,
  }
})
