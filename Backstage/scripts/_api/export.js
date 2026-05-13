const METHOD_WITH_BODY = new Set(['post', 'put', 'patch'])

const FETCH_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'postForm', 'putForm', 'patchForm']

const FORM_METHOD_MAP = {
  postform: 'post',
  putform: 'put',
  patchform: 'patch',
}

const isPlainObject = (v) => v != null && Object.prototype.toString.call(v) === '[object Object]'

const isBlobLike = (v) => typeof Blob !== 'undefined' && v instanceof Blob

const toPOJOHeaders = (headers) => (headers ? Object.fromEntries(headers.entries()) : {})

const isFetchMethod = (value) =>
  typeof value === 'string' && FETCH_METHODS.includes(value.toLowerCase())

const onReplacePathParams = (path, data) => {
  const keys = Array.from(path.matchAll(/\{\s?(\w+)\s?\}/g)).map((m) => m[1])

  let url = path

  for (const key of keys) {
    const val = data?.[key]

    if (val == null || val === '') {
      throw new Error(`[onFetchApi] missing path param: ${key}`)
    }

    url = url.replaceAll(`{${key}}`, encodeURIComponent(String(val)))
  }

  return { url, usedKeys: new Set(keys) }
}

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

const toFormData = (data = {}) => {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    appendFormValue(formData, key, value)
  }

  return formData
}

const buildQueryString = (query = {}) => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, String(item))
      }
      continue
    }

    params.append(key, String(value))
  }

  const qs = params.toString()

  return qs ? `?${qs}` : ''
}

const joinURL = (baseURL, path) => {
  if (!baseURL) return path

  const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const urlPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${urlPath}`
}

const parseResponseData = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (response.status === 204) return null

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

const isJsonResponse = (response) => {
  const contentType = response.headers.get('content-type') || ''

  return contentType.includes('application/json')
}

const shouldReceiveJson = (headers = {}) => {
  const accept = headers.Accept || headers.accept || ''

  return accept.includes('application/json')
}

const createResponseStatusData = (message) => ({
  responseStatus: {
    message,
  },
})

const createSafeConfig = (method, baseURL, url, opts = {}) => ({
  method,
  baseURL,
  url,
  query: isPlainObject(opts.query) ? opts.query : undefined,
  body: isPlainObject(opts.body) ? opts.body : undefined,
})

const resolveValue = async (value) => {
  if (typeof value === 'function') return await value()
  return value
}

const createRequestOptions = (method, data, usedKeys, isFormRequest) => {
  const rest = {}

  for (const [key, value] of Object.entries(data ?? {})) {
    if (!usedKeys.has(key) && value !== undefined) {
      rest[key] = value
    }
  }

  const hasRest = Object.keys(rest).length > 0

  const opts = {
    method: method.toUpperCase(),
    query: undefined,
    body: undefined,
    headers: undefined,
    safeBody: undefined,
  }

  if (!hasRest && !METHOD_WITH_BODY.has(method)) {
    return opts
  }

  if (METHOD_WITH_BODY.has(method)) {
    if (isFormRequest) {
      opts.body = toFormData(rest)
    } else {
      opts.body = JSON.stringify(rest)
      opts.safeBody = rest
      opts.headers = {
        'content-type': 'application/json',
      }
    }

    return opts
  }

  opts.query = rest

  return opts
}

const createInterceptorManager = () => {
  const handlers = []

  return {
    use(onFulfilled, onRejected) {
      handlers.push({
        onFulfilled,
        onRejected,
      })

      return handlers.length - 1
    },

    eject(id) {
      if (handlers[id]) {
        handlers[id] = null
      }
    },

    async runFulfilled(value) {
      let result = value

      for (const handler of handlers) {
        if (!handler?.onFulfilled) continue
        result = await handler.onFulfilled(result)
      }

      return result
    },

    async runRejected(error) {
      let result = error

      for (const handler of handlers) {
        if (!handler?.onRejected) continue
        result = await handler.onRejected(result)
      }

      return result
    },
  }
}

const createErrorResponse = ({
  status,
  statusCode,
  statusText,
  headers,
  config,
  data,
  message,
}) => ({
  status,
  statusCode: statusCode ?? status,
  statusText,
  headers: headers ?? {},
  config,
  data,
  message,
  isError: true,
})

export const onFetchApi = (globalConfig = {}) => {
  const { baseURL, headers, fetcher = fetch } = globalConfig

  const interceptors = {
    request: createInterceptorManager(),
    response: createInterceptorManager(),
  }

  const executeFetchApi = async (method, path, data, requestConfig = {}) => {
    let safeConfig

    try {
      if (!isFetchMethod(method)) {
        throw new Error(`[onFetchApi] invalid method: ${method}`)
      }

      if (!path) {
        throw new Error('[onFetchApi] path is required')
      }

      const rawMethod = method.toLowerCase()
      const fetchMethod = FORM_METHOD_MAP[rawMethod] ?? rawMethod
      const isFormRequest = rawMethod in FORM_METHOD_MAP

      const finalBaseURL = requestConfig.baseURL ?? (await resolveValue(baseURL))

      if (!finalBaseURL) {
        throw new Error('[onFetchApi] baseURL is required')
      }

      const globalHeaders = await resolveValue(headers)
      const localHeaders = await resolveValue(requestConfig.headers)

      const { url: urlPath, usedKeys } = onReplacePathParams(path, data)

      const reqPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`

      const opts = createRequestOptions(fetchMethod, data, usedKeys, isFormRequest)

      const queryString = opts.query ? buildQueryString(opts.query) : ''
      const requestURL = `${joinURL(finalBaseURL, reqPath)}${queryString}`

      safeConfig = createSafeConfig(fetchMethod, finalBaseURL, reqPath, {
        query: opts.query,
        body: opts.safeBody,
      })

      let fetchConfig = {
        method: opts.method,
        url: requestURL,
        baseURL: finalBaseURL,
        path: reqPath,
        headers: {
          Accept: 'application/json',
          ...opts.headers,
          ...globalHeaders,
          ...localHeaders,
        },
        body: opts.body,
        signal: requestConfig.signal,
        credentials: requestConfig.credentials,
        config: safeConfig,
      }

      fetchConfig = await interceptors.request.runFulfilled(fetchConfig)

      const response = await fetcher(fetchConfig.url, {
        method: fetchConfig.method,
        headers: fetchConfig.headers,
        body: fetchConfig.body,
        signal: fetchConfig.signal,
        credentials: fetchConfig.credentials,
      })

      const resData = await parseResponseData(response)
      const isInvalidJsonResponse =
        response.ok &&
        response.status !== 204 &&
        shouldReceiveJson(fetchConfig.headers) &&
        !isJsonResponse(response)

      if (!response.ok || isInvalidJsonResponse) {
        const status = isInvalidJsonResponse ? 404 : response.status
        const statusText = isInvalidJsonResponse ? 'Invalid JSON response' : response.statusText
        const data = isInvalidJsonResponse
          ? createResponseStatusData('Invalid JSON response')
          : resData
        let errorResponse = createErrorResponse({
          status,
          statusCode: status,
          statusText,
          headers: toPOJOHeaders(response.headers),
          config: fetchConfig.config ?? safeConfig,
          data,
          message: statusText || 'Fetch error',
        })

        errorResponse = await interceptors.response.runRejected(errorResponse)

        return errorResponse
      }

      let result = {
        status: response.status,
        statusText: response.statusText,
        headers: toPOJOHeaders(response.headers),
        config: fetchConfig.config ?? safeConfig,
        data: resData,
        isError: false,
      }

      result = await interceptors.response.runFulfilled(result)

      return result
    } catch (error) {
      let errorResponse = createErrorResponse({
        status: error?.status,
        statusCode: error?.statusCode,
        statusText: error?.statusText || error?.message,
        headers: error?.headers,
        config: error?.config ?? safeConfig,
        data: error?.data,
        message: error?.message || 'Fetch error',
      })

      errorResponse = await interceptors.response.runRejected(errorResponse)

      return errorResponse
    }
  }

  const api = (...args) => {
    if (args.length >= 2 && isFetchMethod(args[0])) {
      const [method, path, data, config] = args
      return executeFetchApi(method, path, data, config)
    }

    const [path, data, config] = args
    return executeFetchApi('get', path, data, config)
  }

  for (const method of FETCH_METHODS) {
    api[method] = (path, data, config) => executeFetchApi(method, path, data, config)
  }

  api.interceptors = interceptors

  return api
}
