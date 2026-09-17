// 買屋列表的網址正規化:舊網址相容、region 與 mrt 互斥、代碼合法性。
//
// 掛在列表頁上而不是全站:這裡每一條判斷都只看 /buy 的網址,
// 設成全站的話,會員、租屋、社區每一次換頁都要先跑完整段才發現不是自己的事。
import { useBuyListStore } from '@stores/buy/list.js'

export default defineNuxtRouteMiddleware(async (to) => {
  const list = useBuyListStore()
  const { region, mrt } = storeToRefs(list)
  const { onChannel, onGetBuyListParams, onApiGetRegion, onApiGetMrt, onApiGetBuyList } =
    useBuyListActions()

  const defaultListPath = `/buy/${region.value.defaultIDs}_region/?pg=1`
  const defaultMrtPath = `/buy/${mrt.value.defaultIDs}_mrt/?pg=1`

  // 代碼合法性要拿選項清單來比對。取不到就不驗 ——
  // 為了選項的 api 一時失敗,把使用者導去預設列表,比讓那個網址過去更糟。
  //
  // 選項怎麼取、載過就不重取,都在 action 裡;這裡只負責「取不到也要走得下去」。
  const onLoadOptions = async (loadOptions) => {
    try {
      await loadOptions()
    } catch {
      // 靜默:取不到選項時跳過代碼驗證
    }
  }

  // 舊網址前綴 /buy/list 已改為 /buy:
  // 純 /buy/list(無條件)視同買屋首頁 → 導到預設縣市列表
  if (to.path === '/buy/list' || to.path === '/buy/list/') {
    return navigateTo(defaultListPath, { replace: true })
  }

  // /buy/list/{條件...} → /buy/{條件...}(去掉 list,保留篩選與 query)
  // 涵蓋舊分享連結與後端麵包屑仍帶 /buy/list 的情況
  if (to.path.startsWith('/buy/list/')) {
    return navigateTo(
      { path: `/buy${to.path.slice('/buy/list'.length)}`, query: to.query, hash: to.hash },
      { replace: true }
    )
  }

  const filters = Array.isArray(to.params.filters)
    ? to.params.filters
    : to.params.filters
      ? [to.params.filters]
      : []

  // region 與 mrt 是互斥頻道:網址同時帶兩者時,只保留「先出現」的那個,移除另一個。
  // 例:/13_region/0102_mrt → /13_region;/0102_mrt/13_region → /0102_mrt
  const regionIndex = filters.findIndex((item) => /_region$/.test(item))
  const mrtIndex = filters.findIndex((item) => /_mrt$/.test(item))

  if (regionIndex !== -1 && mrtIndex !== -1) {
    const dropPattern = regionIndex < mrtIndex ? /_mrt$/ : /_region$/
    const nextFilters = filters.filter((item) => item && !dropPattern.test(item))

    return navigateTo(
      { path: `/buy/${nextFilters.join('/')}/`, query: to.query, hash: to.hash },
      { replace: true }
    )
  }

  // region 代碼驗證:必須為數字,且存在於 apiGetRegion(縣市 / 區域 id);否則回預設 01。
  // 擋掉 abc_region(非數字 → 後端當無篩選、全站曝光)與 99_region(數字但無此縣市 → 顯示 null)。
  const regionFilter = filters.find((item) => /_region$/.test(item))

  if (regionFilter) {
    const parts = regionFilter
      .replace(/_region$/, '')
      .split(',')
      .filter(Boolean)
    const isNumeric = parts.length > 0 && parts.every((part) => /^\d+$/.test(part))
    let isValid = isNumeric

    if (isNumeric) {
      await onLoadOptions(onApiGetRegion)

      const options = region.value.options

      // options 取不到(API 失敗)時不誤擋,維持數字檢查結果
      if (options) {
        const validIds = new Set()

        for (const city of options) {
          validIds.add(String(city.id))
          for (const area of city.areas ?? []) validIds.add(String(area.id))
        }

        isValid = parts.every((part) => validIds.has(part))
      }
    }

    if (!isValid) {
      return navigateTo(defaultListPath, { replace: true })
    }
  }

  // mrt 代碼驗證:必須為數字,且存在於 apiGetMrt(運營商 / 線路 / 站點 id);否則回預設線路。
  const mrtFilter = filters.find((item) => /_mrt$/.test(item))

  if (mrtFilter) {
    const parts = mrtFilter.replace(/_mrt$/, '').split(',').filter(Boolean)
    const isNumeric = parts.length > 0 && parts.every((part) => /^\d+$/.test(part))
    let isValid = isNumeric

    if (isNumeric) {
      await onLoadOptions(onApiGetMrt)

      const options = mrt.value.options

      // options 取不到(API 失敗)時不誤擋,維持數字檢查結果
      if (options) {
        const validIds = new Set()

        for (const operator of options) {
          validIds.add(String(operator.id))
          for (const line of operator.lines ?? []) {
            validIds.add(String(line.id))
            for (const station of line.stations ?? []) validIds.add(String(station.id))
          }
        }

        isValid = parts.every((part) => validIds.has(part))
      }
    }

    if (!isValid) {
      return navigateTo(defaultMrtPath, { replace: true })
    }
  }

  // 買屋首頁 → 預設縣市列表
  if (to.path === '/buy' || to.path === '/buy/') {
    return navigateTo(defaultListPath, { replace: true })
  }

  // 網址確定之後才取列表 —— 上面每一條都可能改寫網址,先取的話會對著舊條件打一次。
  //
  // 放在這裡而不是頁面的 setup:H1 由共用的頁首輸出,而頁首的渲染早於頁面的 setup。
  // 換頁守衛跑在頁面元件建立之前,所以這裡寫進 store 的 seo,頁首渲染時就讀得到。
  onChannel(to)
  onGetBuyListParams(to)
  await onApiGetBuyList(to)
})
