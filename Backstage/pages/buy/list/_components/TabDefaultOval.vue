<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { aggregate } = storeToRefs(buyList)
const { onReset } = useBuyListActions()
const isDeviceM = computed(() => device.value === 'm')

function onAggregate(key) {
  return isDeviceM.value
    ? ''
    : `<small class="text-[12px] font-normal m:hidden">(${aggregate.value[key]})</span>`
}

const items = computed(() => {
  return [
    {
      label: `刊登中 ${onAggregate('countOnline')}`,
      to: {
        name: 'buy-list-publish',
        query: {
          pg: '1',
        },
      },
    },
    {
      label: `已下架 ${onAggregate('countOffline')}`,
      to: {
        name: 'buy-list-offline',
        query: {
          pg: '1',
        },
      },
    },
    {
      label: `草稿區 ${onAggregate('countDraft')}`,
      to: {
        name: 'buy-list-draft',
        query: {
          pg: '1',
        },
      },
    },
    {
      label: `已成交 ${onAggregate('countDeal')}`,
      to: {
        name: 'buy-list-deal',
        query: {
          pg: '1',
        },
      },
    },
  ]
})

const onClick = () => {
  onReset()
}

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
</script>

<template>
  <BuyMTabDefaultOval
    :items="items"
    :config="{
      containerMode: false,
      icon: {
        name: 'icon_check_solid',
      },
    }"
    :setClass="{
      main: '--orange-e646 --anchor-height-40 p:--anchor-px-20 tm:--anchor-px-14',
      headerItem: 'm:flex-1',
    }"
    @click="onClick"
  />
</template>

<style lang="postcss"></style>
