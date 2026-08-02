<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { region } = storeToRefs(buyList)
const { condition, onResetSearch } = useBuyListActions()
const router = useRouter()

const buttons = readonly([
  {
    label: '重置搜尋條件',
    icon: 'icon_arrows_rotate',
    onClcik: onClearAll,
  },
  {
    label: '訂閱搜尋條件',
    icon: 'icon_bell',
  },
])

const isDeviceP = computed(() => device.value === 'p')
const conditionsLabel = computed(() => condition.value.map((item) => item.label).join('、'))

function onClearAll() {
  // 清空 store 所有篩選,再導回預設縣市列表(觸發重新查詢)
  onResetSearch()
  router.push({
    name: buyList.basicRouteName,
    params: { filters: [`${region.value.defaultIDs}_region`] },
    query: { pg: 1 },
  })
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
  <div class="flex items-center" v-if="isDeviceP">
    <div class="flex grow text-[14px]">
      <b class="shrink-0">您目前查詢的是：</b>
      <p>{{ conditionsLabel }}</p>
      <small>的待售物件</small>
    </div>
    <ul class="flex shrink-0 items-center gap-x-[20px]">
      <li v-for="(item, index) in buttons" :key="`${item.label}_${index}`">
        <CommonMAnchor
          :text="item.label"
          :config="{
            icon: {
              name: item.icon,
              position: 'left',
            },
          }"
          :setClass="{
            main: 'gap-x-[3px]',
            text: 'text-[14px]',
            icon: 'h-[16px] w-[16px] p-[1px]',
          }"
          @click="item.onClcik"
        />
      </li>
    </ul>
  </div>
</template>

<style></style>
