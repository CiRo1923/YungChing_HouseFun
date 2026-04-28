import { defineStore } from 'pinia'

export const useBuyPopupStore = defineStore('buyPopup', () => {
  const buttons = readonly({
    alert: [
      {
        label: '確認',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
    confirm: [
      {
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        label: '確認',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })

  return {
    buttons,
  }
})
