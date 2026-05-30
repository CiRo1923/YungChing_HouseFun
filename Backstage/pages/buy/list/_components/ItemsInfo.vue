<script setup>
import { numberComma } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { planAggregate } = storeToRefs(buyList)

const isDeviceM = computed(() => device.value === 'm')
const items = computed(() => {
  const baseItems = [
    {
      planName: 'Listing',
      icon: 'icon_publish',
      label: '刊登額度',
      total: 0,
      expired: 0,
    },
    {
      planName: 'Golden',
      icon: 'icon_diamond',
      label: '黃金曝光',
      total: 0,
      expired: 0,
    },
    {
      planName: 'Refresh',
      icon: 'icon_double_star',
      label: '自動刷新',
      total: 0,
      expired: 0,
    },
  ]

  return baseItems.map((item) => {
    const plan = planAggregate.value.find((plan) => plan.planName === item.planName)

    return {
      ...item,
      total: plan?.availableCount ? numberComma.add(plan.availableCount) : 0,
      expired: plan?.expiringSoonCount ? numberComma.add(plan.expiringSoonCount) : 0,
    }
  })
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
  <div
    class="flex items-center justify-center bg-[--white] tracking-wider m:rounded-full tm:min-h-[30px] pt:rounded-[15px] p:min-h-[40px] p:px-[16px]"
  >
    <BuyMSeparator
      :items="items"
      :setClass="{
        main: '--horizontal p:--gap-x-32 tm:--gap-x-8 text-[--gray-666]',
        item: 'flex items-center text-[14px] t:gap-x-[8px] p:gap-x-[16px]',
      }"
      v-slot="{ item }"
    >
      <div class="flex items-center pt:gap-x-[3px]">
        <CommonSvgIcon :icon="item.icon" class="h-[16px] w-[16px]" v-if="!isDeviceM" />
        <p>
          {{ item.label }} <b>{{ item.total }}</b>
        </p>
      </div>
      <p v-if="!isDeviceM">
        快到期 <b class="font-semibold text-[--orange-e646]">{{ item.expired }}</b>
      </p>
    </BuyMSeparator>
  </div>
</template>

<style lang="postcss"></style>
