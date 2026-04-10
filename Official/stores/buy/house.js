import { defineStore } from 'pinia'

export const useBuyHouseStore = defineStore('house', () => {
  const detail = ref(null)
  const breadcrumb = ref(null) // 麵包屑
  const basic = ref(null) // 基本資訊
  const pricing = ref(null) // 價格資訊
  const media = ref(null) // 多媒體
  const floor = ref(null) // 樓層
  const community = ref(null) // 社區
  const parking = ref(null) // 停車資訊
  const pin = ref(null) // 坪數
  const actualPrice = ref(null) // 實價登入
  const broker = ref(null) // 經紀人
  const poi = ref(null)

  return {
    detail,
    breadcrumb,
    basic,
    pricing,
    media,
    floor,
    community,
    parking,
    pin,
    actualPrice,
    broker,
    poi,
  }
})
