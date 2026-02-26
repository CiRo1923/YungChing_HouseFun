const { public: env } = useRuntimeConfig()
const isDevMode = env.NUXT_PUBLIC_APP_MODE === 'dev'
const METHOD_WITH_BODY = new Set(['post', 'put', 'patch'])

const onReplacePathParams = (path, data) => {
  const keys = Array.from(path.matchAll(/\{\s?(\w+)\s?\}/g)).map((m) => m[1])

  let url = path
  for (const key of keys) {
    const val = data?.[key]
    if (val == null || val === '') {
      throw new Error(`[useFetchApi] missing path param: ${key}`)
    }
    url = url.replaceAll(`{${key}}`, encodeURIComponent(String(val)))
  }
  return { url, usedKeys: new Set(keys) }
}

const toPOJOHeaders = (headers) => (headers ? Object.fromEntries(headers.entries()) : {})

const isPlainObject = (v) => v != null && Object.prototype.toString.call(v) === '[object Object]'

export const fetchApi = async (method, path, data) => {
  const m = method.toLowerCase()
  const { url: urlPath, usedKeys } = onReplacePathParams(path, data)

  const rest = {}
  for (const [k, v] of Object.entries(data ?? {})) {
    if (!usedKeys.has(k) && v !== undefined) rest[k] = v
  }

  const opts = { method: m }
  if (Object.keys(rest).length) {
    if (METHOD_WITH_BODY.has(m)) opts.body = rest
    else opts.query = rest
  }

  const reqPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`

  const baseURL = !isDevMode
    ? env.NUXT_PUBLIC_API_PATH
    : import.meta.server
      ? env.NUXT_PUBLIC_API_PATH
      : undefined

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  try {
    const res = await $fetch.raw(reqPath, { ...opts, baseURL, headers })

    // 只回傳可序列化的 config（避免 FormData/URLSearchParams）
    const safeConfig = {
      method: m,
      baseURL: baseURL ?? '',
      url: reqPath,
      query: isPlainObject(opts.query) ? opts.query : undefined,
      body: isPlainObject(opts.body) ? opts.body : undefined,
    }

    return {
      status: res.status,
      statusText: res.statusText,
      headers: toPOJOHeaders(res.headers),
      config: safeConfig,
      data: res._data,
    }
  } catch (error) {
    // 不要把原始 error 直接 throw（裡面常含 non-POJO）
    const status = error?.response?.status
    const payload = error?.response?._data

    const e = new Error(error?.message || 'Fetch error')
    e.statusCode = status
    e.data = payload
    throw e
  }
}

export const apiGETRealEstate = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstate/{hfid}', data)

export const apiGETRealEstatePurposeCheckOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstatePurpose/check-options', data)

export const apiGETCitySelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/city/select-options', data)

export const apiGETDistrictSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/{cityCode}/district/select-options', data)

export const apiGETRoad = async (data) =>
  await fetchApi('get', 'api/v1/buy/{cityCode}/{districtCode}/Road', data)

export const apiGETRealEstateTypeSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateType/select-options', data)

export const apiGETRealEstateLegalUsageSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateLegalUsage/select-options', data)

export const apiGETRealEstateZoingCheckOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateZoing/check-options', data)

export const apiGETRealEstateZoingCitySelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateZoingCity/select-options', data)

export const apiGETRealEstateZoingLandSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateZoingLand/select-options', data)

export const apiGETRealEstateFloorSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateFloor/select-options', data)

export const apiGETCommunities = async (data) =>
  await fetchApi('get', 'api/v1/buy/communities', data)

export const apiGETRealEstateFaceSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateFace/select-options', data)

export const apiGETRealEstateStructionSelectOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateStruction/select-options', data)

export const apiGETRealEstateBarrierFreeCheckOptions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateBarrierfree/check-options', data)

export const apiGETRealEstateManageTypeSelectOpstions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateManageType/select-opstions', data)

export const apiGETRealEstateManageDutySelectOpstions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateManageDuty/select-opstions', data)

export const apiGETRealEstateManagePayPeriodSelectOpstions = async (data) =>
  await fetchApi('get', 'api/v1/buy/realEstateManagePayPeriod/select-opstions', data)
