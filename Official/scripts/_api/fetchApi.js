import { onFetchApi } from '@js/_api/export.js'

const { public: env } = useRuntimeConfig()
const isDevMode = env.NUXT_PUBLIC_APP_MODE === 'dev'
const baseURL = !isDevMode
  ? env.NUXT_PUBLIC_API_PATH
  : import.meta.server
    ? env.NUXT_PUBLIC_API_PATH
    : undefined
const manageURL = !isDevMode
  ? env.NUXT_PUBLIC_MANAGE_API_PATH
  : import.meta.server
    ? env.NUXT_PUBLIC_MANAGE_API_PATH
    : undefined

export const version = 'v1'
export const onFetchBasicApi = (method, path, data) => onFetchApi(baseURL, method, path, data)
export const onFetchManageApi = (method, path, data) => onFetchApi(manageURL, method, path, data)
