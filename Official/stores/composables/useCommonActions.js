import { useCommonStore } from '@stores/common.js'

const useCommonActions = () => {
  const common = useCommonStore()
  const { isLoading } = storeToRefs(common)
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
    onWithLoadingAll,
    onReset,
  }
}

export default useCommonActions
