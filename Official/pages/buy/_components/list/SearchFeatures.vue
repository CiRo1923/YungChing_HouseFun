<script setup>
import { onResolveByDevice } from '@js/_projectPrototype.js'

import { onDeepMerge } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const manage = useManageStore()
const { options } = storeToRefs(manage)
const buyList = useBuyListStore()
const { content } = storeToRefs(buyList)
const { onCustom } = usePopupActions()

const emits = defineEmits(['routerPush'])
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
})

// 內部預設 config,與 props.config 深合併以供外部擴充(未來其他設定可加在此空物件)。
const config = computed(() => onDeepMerge({}, props.config))

// maxItems 可為數字(各裝置同值)或物件(依 device 解析;device 只有 p/t/m,pt/tm 為涵蓋快捷,
// 例:{p, tm} / {pt, m})。響應式物件必須「整包取代」不可 deep-merge,否則預設 key 會蓋掉
// 使用者的部分覆蓋(如預設 t:5 會讓使用者的 tm 在平板失效)。故未傳時才套預設 { pt:5, m:3 }。
const isDeviceM = computed(() => device.value === 'm')
// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})
const maxItems = computed(
  () => onResolveByDevice(config.value.maxItems ?? { pt: 5, m: 3 }, device.value) ?? 5
)
const topFeatures = computed(() => options.value.features?.slice(0, maxItems.value) ?? [])
const hasMore = computed(() => options.value.features?.length > maxItems.value)

const onRouterPush = () => {
  emits('routerPush')
}

const onPopupFeaturesClick = async () => {
  const { isSure } = await onCustom({
    id: 'popupFeatures',
    title: '物件特色',
    btns: 'alert',
  })

  if (isSure) {
    onRouterPush()
  }
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
  <div class="flex items-center gap-x-[10px] text-[14px] tm:pt-[15px] p:pt-[20px]">
    <span class="font-bold text-[--gray-666]" v-if="!isDeviceM">物件特色</span>
    <ul class="flex items-center gap-x-[10px]">
      <li v-for="(item, index) in topFeatures" :key="`${item.text}_${item.code}_${index}`">
        <CommonMFormCheckBox
          name="tag"
          v-model="apiData.tag"
          :config="{
            label: item.text,
            value: item.code,
          }"
          :setClass="{
            main: '--icon-size-16 --checkbox-green-8d0d',
          }"
          @change="onRouterPush"
        />
      </li>
      <li
        class="relative pl-[11px] pt:before:absolute pt:before:left-0 pt:before:top-1/2 pt:before:h-[12px] pt:before:w-[1px] pt:before:-translate-y-1/2 pt:before:bg-[--gray-ccce] pt:before:content-default"
        v-if="hasMore"
      >
        <CommonMAnchor
          :text="isDeviceM ? '更多特色' : '看更多'"
          :setClass="{
            main: 'underline',
          }"
          @click="onPopupFeaturesClick"
        />
      </li>
    </ul>
  </div>
</template>
