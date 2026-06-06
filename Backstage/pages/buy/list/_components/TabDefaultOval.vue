<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { aggregate } = storeToRefs(buyList)
const { onSearchReset } = useBuyListActions()
const isDeviceM = computed(() => device.value === 'm')

function onAggregate(key) {
  return isDeviceM.value
    ? ''
    : `<small class="text-[12px] font-normal">(${aggregate.value[key]})</small>`
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
  onSearchReset()
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <BuyMTabDefaultOval
    :items="items"
    :config="{
      containerMode: 'single',
      icon: {
        name: 'icon_check_solid',
      },
    }"
    :setClass="{
      main: '--orange-e646 --anchor-height-40 p:--anchor-px-20 tm:--anchor-px-14',
      headerItem: 'm:flex-1',
      body: 'rounded-b-[15px] bg-[--white] py-[32px] tm:px-[16px] p:px-[40px]',
    }"
    @click="onClick"
  >
    <slot />
  </BuyMTabDefaultOval>
</template>

<style lang="postcss"></style>
