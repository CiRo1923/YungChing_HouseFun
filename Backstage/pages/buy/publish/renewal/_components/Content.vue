<script setup>
import PublishInfo from '@pages/buy/_components/PublishInfo.vue'
import RenewalInfo from '@pages/buy/_components/RenewalInfo.vue'

import LabelText from '@pages/buy/publish/_components/LabelText.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'

const buyProject = useBuyProjectStore()
const { renewal } = storeToRefs(buyProject)
const { onResetPojectData } = useBuyProjectActions()
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddress: 'address',
    buName: 'community',
    casePrice: 'price',
    pucURLCover: 'cover',
  }

  return renewal.data.value
    ? Object.fromEntries(
        Object.entries(renewal.data.value)
          .filter(([key]) => keyMap[key])
          .map(([key, value]) => [keyMap[key], value])
      )
    : null
})

onResetPojectData('renewal')
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
      <RenewalInfo />
    </BuyMCardDefault>
  </div>
</template>

<style lang="postcss"></style>
