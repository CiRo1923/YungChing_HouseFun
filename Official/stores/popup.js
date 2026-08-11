import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', () => {
  let alertCheck = ref(null)
  let confirmCheck = ref(null)
  let customCheck = ref(null)
  const promise = ref({
    message: '資料處理中，請勿退出或關閉頁面<br />感謝您耐心等候！',
    status: 'close', // 'open' / 'close'
  })
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
        class: '--bg-orange-f74c --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })
  const alertData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
  })
  const confirmData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
  })

  const customData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    data: null,
    btns: null,
    hasExistClose: true,
  })

  const apiPromiseData = reactive({
    id: null,
    title: null,
    content: promise.value.message,
    hasExistClose: false,
  })
  const apiError = ref(null)

  return {
    alertCheck,
    confirmCheck,
    customCheck,
    promise,
    buttons,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  }
})
