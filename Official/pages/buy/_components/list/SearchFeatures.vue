<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)
const { onCustom } = useBuyPopupActions()

const maxItems = 5

const emits = defineEmits(['routerPush'])

const isDeviceM = computed(() => device.value === 'm')
const topFeatures = computed(() => options.value.features?.slice(0, maxItems) ?? [])
const hasMore = computed(() => (isDeviceM.value ? true : options.value.features?.length > maxItems))
const more = computed(() => {
  return {
    label: isDeviceM.value ? '物件特色' : '看更多',
    class: isDeviceM.value ? '--oval --h-30 --bg-green-8b0d --text-white --px-20' : 'underline',
  }
})

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
      <template v-if="!isDeviceM">
        <li v-for="(item, index) in topFeatures" :key="`${item.text}_${item.code}_${index}`">
          <BuyMFormCheckBox
            name="tag"
            v-model="apiSearchData.tag"
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
      </template>
      <li
        class="relative pl-[11px] pt:before:absolute pt:before:left-0 pt:before:top-1/2 pt:before:h-[12px] pt:before:w-[1px] pt:before:-translate-y-1/2 pt:before:bg-[--gray-ccce] pt:before:content-default"
        v-if="hasMore"
      >
        <BuyMAnchor
          :text="more.label"
          :setClass="{
            main: more.class,
          }"
          @click="onPopupFeaturesClick"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss"></style>
