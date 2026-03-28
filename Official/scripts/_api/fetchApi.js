import { onFetchApi } from '@js/_api/export.js'

const getApiBaseUrls = () => {
  const { public: env } = useRuntimeConfig()
  const isDevMode = env.NUXT_PUBLIC_APP_MODE === 'dev'

  return {
    baseURL:
      !isDevMode || import.meta.server ? env.NUXT_PUBLIC_API_PATH : undefined,
    manageURL:
      !isDevMode || import.meta.server ? env.NUXT_PUBLIC_MANAGE_API_PATH : undefined,
  }
}

export const version = 'v1'
export const onFetchBasicApi = (method, path, data) => {
  const { baseURL } = getApiBaseUrls()
  return onFetchApi(baseURL, method, path, data)
}

export const onFetchManageApi = (method, path, data) => {
  const { manageURL } = getApiBaseUrls()
  return onFetchApi(manageURL, method, path, data)
}
