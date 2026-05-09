<script setup>
import { numberComma } from '@js/_prototype.js'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { availablePlans, renewalPlanId } = storeToRefs(buyProject)

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <ul class="mx-auto m:space-y-[16px] pt:space-y-[8px] p:max-w-[800px]" :class="setClass.main">
    <li v-for="(item, index) in availablePlans" :key="`${item.planType}_${item.planId}_${index}`">
      <BuyMFormRadioItem
        :name="`planId[${index}]`"
        v-model="renewalPlanId"
        :config="{
          value: item.planId,
        }"
        :rules="{
          required: '請選擇額度',
        }"
        :setClass="{
          main: 'p:--px-40 p:--py-16 tm:p-16',
          label: 'text-[16px] text-[--gray-666] pt:flex pt:items-center',
        }"
      >
        <p class="pt:grow">{{ item.planName }}</p>
        <div class="flex items-center p:gap-x-[30px]">
          <p class="grow p:w-[135px]">
            {{ item.isExchange ? `${item.expireDate} 到期` : `刊登期 ${item.durationDays} 天` }}
          </p>
          <p class="shrink-0">
            剩餘額度：<b class="font-semibold text-[--orange-e646]">
              {{ numberComma.add(item.availableCount) }}
            </b>
          </p>
        </div>
      </BuyMFormRadioItem>
    </li>
  </ul>

  <!-- <pre>
    {{ availablePlans }}
  </pre> -->
</template>

<style lang="postcss"></style>
