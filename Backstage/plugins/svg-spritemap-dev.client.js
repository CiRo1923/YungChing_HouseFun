const clientEvent = 'project:svg-spritemap-update'

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) {
    return
  }

  const spriteVersion = useState('svgSpriteVersion', () => '')

  if (import.meta.hot) {
    import.meta.hot.on(clientEvent, (data) => {
      spriteVersion.value = String(data?.version || Date.now())
    })
  }
})
