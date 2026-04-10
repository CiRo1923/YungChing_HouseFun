const METHOD_WITH_BODY = new Set(['post', 'put', 'patch'])
const FORM_METHOD_MAP = {
  postForm: 'post',
  putForm: 'put',
  patchForm: 'patch',
}

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

const isBlobLike = (v) =>
  typeof Blob !== 'undefined' && v instanceof Blob

const appendFormValue = (formData, key, value) => {
  if (value == null) return

  if (Array.isArray(value)) {
    for (const item of value) appendFormValue(formData, key, item)
    return
  }

  if (isBlobLike(value)) {
    formData.append(key, value)
    return
  }

  if (value instanceof Date) {
    formData.append(key, value.toISOString())
    return
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    formData.append(key, String(value))
    return
  }

  if (isPlainObject(value)) {
    formData.append(key, JSON.stringify(value))
    return
  }

  formData.append(key, value)
}

const toFormData = (data) => {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    appendFormValue(formData, key, value)
  }

  return formData
}

export const onFetchApi = async (baseURL, method, path, data) => {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const rawMethod = method.toLowerCase()
  const m = FORM_METHOD_MAP[rawMethod] ?? rawMethod
  const isFormRequest = rawMethod in FORM_METHOD_MAP
  const { url: urlPath, usedKeys } = onReplacePathParams(path, data)

  const rest = {}
  for (const [k, v] of Object.entries(data ?? {})) {
    if (!usedKeys.has(k) && v !== undefined) rest[k] = v
  }

  const opts = { method: m }
  if (Object.keys(rest).length) {
    if (METHOD_WITH_BODY.has(m)) opts.body = isFormRequest ? toFormData(rest) : rest
    else opts.query = rest
  }

  const reqPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`

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
