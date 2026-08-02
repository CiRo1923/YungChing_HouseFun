import { useBuyListStore } from '@stores/buy/list.js'
import { apiRegion, apiMrt } from '@js/_api/buy/common.js'

export default defineNuxtRouteMiddleware(async (to) => {
  const pinia = useNuxtApp().$pinia
  const list = useBuyListStore(pinia)
  const { region, mrt } = storeToRefs(list)

  const defaultListPath = `/buy/${region.value.defaultIDs}_region/?pg=1`
  const defaultMrtPath = `/buy/${mrt.value.defaultIDs}_mrt/?pg=1`

  // 取得 region 選項(縣市 + 區域);未載入時打 apiRegion 並寫回 store,
  // 讓頁面的 onApiRegion(if region.options 直接略過)不必重打。API 失敗回 null。
  const ensureRegionOptions = async () => {
    if (region.value.options) return region.value.options

    try {
      const { status, data } = await apiRegion()

      if (status !== 200) return null

      region.value.all = data.items.map((city) => city.id).join(',')
      region.value.options = data.items.map((city) => ({
        ...city,
        areas: [{ id: city.id, name: '全區' }, ...city.areas],
      }))

      return region.value.options
    } catch {
      return null
    }
  }

  // 取得 mrt 選項(運營商 / 線路 / 站點);未載入時打 apiMrt 並寫回 store(頁面 onApiMrt 可略過)。
  const ensureMrtOptions = async () => {
    if (mrt.value.options) return mrt.value.options

    try {
      const { status, data } = await apiMrt()

      if (status !== 200) return null

      mrt.value.all = data.items.map((item) => item.id).join(',')
      mrt.value.options = data.items.map((item) => ({
        ...item,
        lines: item.lines.map((line) => ({
          ...line,
          stations: [{ id: line.id, name: '全站' }, ...line.stations],
        })),
      }))

      return mrt.value.options
    } catch {
      return null
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

  // region 代碼驗證:必須為數字,且存在於 apiRegion(縣市 / 區域 id);否則回預設 01。
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
      const options = await ensureRegionOptions()

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

  // mrt 代碼驗證:必須為數字,且存在於 apiMrt(運營商 / 線路 / 站點 id);否則回預設線路。
  const mrtFilter = filters.find((item) => /_mrt$/.test(item))

  if (mrtFilter) {
    const parts = mrtFilter.replace(/_mrt$/, '').split(',').filter(Boolean)
    const isNumeric = parts.length > 0 && parts.every((part) => /^\d+$/.test(part))
    let isValid = isNumeric

    if (isNumeric) {
      const options = await ensureMrtOptions()

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
})
