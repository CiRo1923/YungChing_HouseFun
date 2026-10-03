<script setup>
import { onFormatDate } from '@js/_prototype.js'
import { onTimeAgo } from '@js/_projectPrototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const isDeviceM = computed(() => device.value === 'm')
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const showMinute = 60
const broker = computed(() => props.item.broker || {})
// serverTime.full 是「台北時間」但無時區(如 2026-08-03 03:25:07),
// 依當地時區解析會讓 SSR(UTC)與 client(+8)差 8 小時 → 相對時間 hydration mismatch。
// 補上 +08:00 轉為絕對時間,與 item 時間(本就帶 +08:00)一致,兩端 parse 結果相同。
const serverFull = computed(() =>
  serverTime.value?.full ? `${serverTime.value.full.replace(' ', 'T')}+08:00` : null
)
// 刷新時間:相對時間的規則見 onTimeAgo(全站共用一套)
const lastUpdateTime = computed(() => onTimeAgo(props.item.lastUpdateTime, serverTime.value?.full))
const latestMessageTime = computed(() => {
  if (!serverFull.value) return 0

  const time = onFormatDate(serverFull.value) - onFormatDate(props.item.latestMessageTime)
  const minute = time / 1000 / 60
  const maxMinute = Math.max(0, Math.floor(minute))
  return maxMinute <= showMinute ? maxMinute : 0
})

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <ul class="mt-[5px] flex shrink-0 items-center t:gap-x-[10px] p:gap-x-[20px]" v-if="!isDeviceM">
    <li class="text-[14px]" v-if="broker.name">{{ broker.name }} / {{ broker.brand }}</li>
    <li class="text-[12px]" v-if="lastUpdateTime">{{ lastUpdateTime }}更新</li>
    <li
      class="flex items-center gap-x-[3px] text-[12px] text-[--orange-f74c]"
      v-if="latestMessageTime"
    >
      <CommonMSvgIcon icon="icon_dialogue" class="h-[16px] w-[16px] shrink-0 p-[2px]" />
      {{ latestMessageTime }} 分鐘前已留言
    </li>
  </ul>
</template>
