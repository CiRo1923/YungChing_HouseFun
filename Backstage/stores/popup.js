import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', () => {
  let alertCheck = ref(null)
  let confirmCheck = ref(null)
  let customCheck = ref(null)
  const alertData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
    setClass: null,
  })
  const confirmData = reactive({
    id: null,
    title: null,
    icon: null,
    content: null,
    btns: null,
    hasExistClose: true,
    setClass: null,
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
    content: '資料處理中，請勿退出或關閉頁面<br />感謝您耐心等候！',
    hasExistClose: false,
  })
  const apiError = ref(null)

  return {
    alertCheck,
    confirmCheck,
    customCheck,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
    apiError,
  }
})
