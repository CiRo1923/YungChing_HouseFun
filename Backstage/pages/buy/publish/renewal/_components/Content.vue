<script setup>
import PublishInfo from '@pages/buy/_components/PublishInfo.vue'
import AvailablePlans from '@pages/buy/_components/AvailablePlans.vue'

import LabelText from '@pages/buy/publish/_components/LabelText.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'

const buyProject = useBuyProjectStore()
const { availablePlans } = storeToRefs(buyProject)
const { onResetApiDataRenewal } = useBuyProjectActions()
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddress: 'address',
    buName: 'community',
    casePrice: 'price',
    pucURLCover: 'cover',
  }

  return availablePlans.value
    ? Object.fromEntries(
        Object.entries(availablePlans.value)
          .filter(([key]) => keyMap[key])
          .map(([key, value]) => [keyMap[key], value])
      )
    : null
})

onResetApiDataRenewal()
</script>

<template>
  <div class="tm:space-y-[24px] p:space-y-[32px]">
    <BuyMCardDefault>
      <PublishInfo :data="publishInfo" v-if="publishInfo" />
    </BuyMCardDefault>
    <BuyMCardDefault
      :setClass="{
        main: 'tm:space-y-[16px] p:space-y-[24px]',
      }"
    >
      <LabelText
        label="請選擇額度"
        icon="icon_quota"
        :setClass="{
          icon: 'text-[--gray-666]',
        }"
      />
      <AvailablePlans />
    </BuyMCardDefault>
  </div>
</template>

<style lang="postcss"></style>
