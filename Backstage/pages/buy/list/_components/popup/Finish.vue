<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

import PublishInfo from '@pages/buy/_components/PublishInfo.vue'
import FinishInfo from '@pages/buy/_components/FinishInfo.vue'

import { usePopupStore } from '@stores/popup.js'

const popup = usePopupStore()
const { customData } = storeToRefs(popup)
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
const hasFinishInfo = computed(() => true)
</script>

<template>
  <CustomPopup
    id="popupFinish"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <PublishInfo :data="publishInfo" v-if="publishInfo" />
    <FinishInfo
      :data="customData.data"
      :setClass="{
        main: 'tm:mt-[16px] p:mt-[24px]',
      }"
      v-if="hasFinishInfo"
    />
  </CustomPopup>
</template>

<style lang="postcss"></style>
