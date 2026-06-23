<script setup>
import { onFormatDate } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { serverTime } = storeToRefs(buyProject)
const isDeviceM = computed(() => device.value === 'm')
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const showMinute = 60
const broker = computed(() => props.item.broker || {})
const lastUpdateTime = computed(() => {
  if (!serverTime.value) return 0

  const time = onFormatDate(serverTime.value.full) - onFormatDate(props.item.lastUpdateTime)
  const minute = time / 1000 / 60
  const maxMinute = Math.max(0, Math.floor(minute))
  return maxMinute <= showMinute ? maxMinute : 0
})
const latestMessageTime = computed(() => {
  if (!serverTime.value) return 0

  const time = onFormatDate(serverTime.value.full) - onFormatDate(props.item.latestMessageTime)
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
    <li class="text-[14px]" v-if="broker.name">{{ broker.name }} / {{ broker.store }}</li>
    <li class="text-[12px]" v-if="lastUpdateTime">{{ lastUpdateTime }} 分鐘前更新</li>
    <li
      class="flex items-center gap-x-[3px] text-[12px] text-[--orange-f74c]"
      v-if="latestMessageTime"
    >
      <CommonSvgIcon icon="icon_dialogue" class="h-[16px] w-[16px] shrink-0 p-[2px]" />
      {{ latestMessageTime }} 分鐘前已留言
    </li>
  </ul>
</template>

<style lang="postcss"></style>
