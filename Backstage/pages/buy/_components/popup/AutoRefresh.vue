<script setup>
import { numberComma } from '@js/_prototype.js'

const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const info = computed(() => autoRefresh.value.info || {})
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddr: 'address',
    buName: 'community',
    casePrice: 'price',
    picURLCover: 'cover',
  }

  return customData.value.data
    ? Object.fromEntries(
        Object.entries(customData.value.data)
          .filter(([key]) => keyMap[key])
          .map(([key, value]) => [keyMap[key], value])
      )
    : null
})
</script>

<template>
  <BuyCommonCustomPopup
    id="popupAutoRefresh"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <template #headerTools>
      <p>
        剩餘自動刷新 <b class="text-[--orange-e646]">{{ numberComma.add(info.availableCount) }}</b>
      </p>
      <BuyMAnchor
        text="購買額度"
        :config="{
          icon: {
            name: 'icon_shopping',
            position: 'left',
          },
        }"
        :setClass="{
          main: '--text-green-6a2d ml-auto underline',
          text: 'text-[14px]',
          icon: 'h-[16px] w-[16px] text-[--gray-666]',
        }"
      />
    </template>

    <PageBuyPublishInfo :data="publishInfo" v-if="publishInfo" />
    <div class="tm:mt-[16px] p:mt-[24px]">
      <PageBuyAutoRefrshInfo />
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
