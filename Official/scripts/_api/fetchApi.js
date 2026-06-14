import { onFetchApi } from '@js/_api/export.js'

const runtimeConfig = useRuntimeConfig()

export const version = 'v1'
export const fetchApi = onFetchApi({
  baseURL: import.meta.dev && import.meta.client ? '/' : runtimeConfig.public.NUXT_PUBLIC_API_PATH,
})
export const fetchManageApi = onFetchApi({
  baseURL:
    import.meta.dev && import.meta.client
      ? '/manage/'
      : runtimeConfig.public.NUXT_PUBLIC_MANAGE_API_PATH,
})
