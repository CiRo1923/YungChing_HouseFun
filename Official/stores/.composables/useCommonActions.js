import * as prototype from '@js/_prototype.js'

export default () => {
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

  const onIsLoading = (boolean) => {
    isLoading.value = boolean
  }

  const onResize = () => {
    device.value = onDevice()
  }

  return {
    onDevice,
    onIsLoading,
    onResize,
  }
}
