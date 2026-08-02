<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { isChannelMrt, onSearchParams } = useBuyProjectActions()
const buyProject = useBuyProjectStore()
const buyHouse = useBuyHouseStore()
const { breadcrumb } = storeToRefs(buyHouse)

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const isDeviceM = computed(() => device.value === 'm')

// 麵包屑:桌機 / 平板用 API 完整麵包屑;僅手機(device m)簡化 —— 只取前 2 筆(首頁 / 買屋),
// 最後一筆改用目前 channel 對應的 channelTabs label(區域找房 / 捷運找房)。
const items = computed(() => {
  const list = breadcrumb.value ?? []

  if (!isDeviceM.value) return list

  const tab = buyProject.channelTabs.find(
    (item) => item.id === (isChannelMrt.value ? 'mrt' : 'region')
  )

  return [...list.slice(0, 2), { text: tab?.label ?? '', url: null }]
})

const onAs = (item) => {
  const { url } = item

  if (url) return 'router-link'

  return 'em'
}

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

// 後端回傳的 url 可能夾帶 query(如 ?pg=1)且無結尾斜線;
// 抽出 pathname 補上 `/`,query 另由 onSearchParams 解析後帶入。
const onPath = (url) => {
  const pathname = url.split(/[?#]/)[0]

  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

const onBind = (item) => {
  const { url } = item
  const params = onSearchParams(url)
  const isBuyChannel = /^\/buy\/list/.test(url)
  const query = params
    ? {
        ...params,
        ...(isBuyChannel ? { pg: 1 } : {}),
      }
    : isBuyChannel
      ? { pg: 1 }
      : {}

  return url
    ? {
        to: {
          path: onPath(url),
          query,
        },
      }
    : {}
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
  <ol class="breadcrumbs flex items-center" :class="setClass.main">
    <li
      class="breadcrumbs-item flex items-center text-[14px] text-[--gray-666]"
      v-for="(item, index) in items"
      :key="`${item.text}_${index}`"
    >
      <component :is="onAs(item)" v-bind="onBind(item)">
        {{ item.text }}
      </component>
    </li>
  </ol>
</template>

<style lang="postcss">
.breadcrumbs-item {
  &:not(:first-child) {
    &::before {
      background-image: url(@imgs/common/breadcrumbs_arrow.svg);

      @apply mx-[10px] h-[10px] w-[6px] bg-cover bg-center bg-no-repeat content-default;
    }
  }
}
</style>
