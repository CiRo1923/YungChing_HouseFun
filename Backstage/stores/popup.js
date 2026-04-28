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
    btns: null,
    hasExistClose: true,
  })

  const apiPromiseData = reactive({
    id: null,
    title: null,
    content: '資料處理中，請勿退出或關閉頁面<br />感謝您耐心等候！',
    hasExistClose: false,
  })

  return {
    alertCheck,
    confirmCheck,
    customCheck,
    alertData,
    confirmData,
    customData,
    apiPromiseData,
  }
})
