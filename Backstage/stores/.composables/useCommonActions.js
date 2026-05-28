import * as prototype from '@js/_prototype.js'

import { useCommonStore } from '@stores/common.js'

const useCommonActions = () => {
  const common = useCommonStore()
  const { isLoading, device } = storeToRefs(common)
  const onDevice = () => {
    const onServer = () => {
      const headers = useRequestHeaders()
      const userAgent = headers['user-agent'] || ''

      const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isPad =
        /iPad/i.test(userAgent) ||
        (/Mac OS X/i.test(userAgent) && /Mobile/i.test(userAgent)) ||
        (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))

      if (isMobile) return 'm'
      if (isPad) return 't'

      return 'p'
    }

    if (import.meta.server) return onServer()
    if (import.meta.client) return prototype.onDevice()
  }
  const onUseMeta = (meta) => {
    const { title, description, url } = meta

    useHead(() => ({
      title: title,
      meta: [
        {
          property: 'og:title',
          itemprop: 'name',
          content: title,
        },
        {
          name: 'description',
          property: 'og:description',
          itemprop: 'description',
          content: description,
        },
        {
          property: 'og:url',
          itemprop: 'url',
          content: url.href,
        },
      ],
      link: [
        {
          rel: 'canonical',
          href: url.href,
        },
      ],
    }))
  }

  const onIsLoading = (boolean) => {
    isLoading.value = boolean
  }

  const onResize = () => {
    device.value = onDevice()
  }

  const onWithLoadingAll = async (promises) => {
    if (import.meta.client) {
      onIsLoading(true)
    }

    try {
      return await Promise.all(promises)
    } finally {
      if (import.meta.client) {
        onIsLoading(false)
      }
    }
  }

  const onReset = () => {
    onIsLoading(false)
  }

  return {
    onUseMeta,
    onIsLoading,
    onResize,
    onWithLoadingAll,
    onReset,
  }
}

export default useCommonActions
