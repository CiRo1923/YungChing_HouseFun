import { onFetchApi } from '@js/_api/export.js'

const API_METHODS = ['get', 'post', 'postForm', 'put', 'putForm', 'patch', 'patchForm', 'delete']

const onGetApiBaseUrls = () => {
  const { public: env } = useRuntimeConfig()
  const isDevMode = env.NUXT_PUBLIC_APP_MODE === 'dev'

  return {
    baseURL: !isDevMode || import.meta.server ? env.NUXT_PUBLIC_API_PATH : undefined,
    manageURL: !isDevMode || import.meta.server ? env.NUXT_PUBLIC_MANAGE_API_PATH : undefined,
  }
}

const onCreateApiClient = (getBaseURL) => {
  const request = (method, path, data) => onFetchApi(getBaseURL(), method, path, data)

  for (const method of API_METHODS) {
    request[method] = (path, data) => request(method, path, data)
  }

  return request
}

export const version = 'v1'
export const onFetchBasicApi = onCreateApiClient(() => onGetApiBaseUrls().baseURL)
export const onFetchManageApi = onCreateApiClient(() => onGetApiBaseUrls().manageURL)
