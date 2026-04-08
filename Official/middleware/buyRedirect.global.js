import { useListStore } from '@stores/buy/list.js'

export default defineNuxtRouteMiddleware((to) => {
  const pinia = useNuxtApp().$pinia
  const list = useListStore(pinia)
  const { region } = storeToRefs(list)

  if (
    to.path === '/buy' ||
    to.path === '/buy/' ||
    to.path === '/buy/list' ||
    to.path === '/buy/list/'
  ) {
    return navigateTo(`/buy/list/${region.value.params}_region?pg=1`, {
      replace: true,
    })
  }
})
