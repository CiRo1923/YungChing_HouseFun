<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
// const popup = usePopupStore()
// const { customData } = storeToRefs(popup)

const props = defineProps({
  update: {
    type: Function,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const info = computed(() => autoRefresh.value.info || {})
const plans = computed(() => autoRefresh.value.plans || {})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})
</script>

<template>
  <div class="mx-auto p:max-w-[800px]" :class="setClass.main">
    <PageBuyPublishLabelText label="現有刷新次數" icon="icon_double_star" />
    <p class="text-center text-[--gray-666] tm:mt-[8px] tm:text-[14px] p:mt-[16px] p:text-[16px]">
      共 <b class="font-semibold text-[--orange-e646]">{{ info.currentCount }}</b> 次
    </p>
    <ul class="mt-[24px] flex flex-wrap items-center justify-center gap-[10px]">
      <li>
        <PageBuyAutoRefreshAddTimeAnchor :update="props.update" />
      </li>
      <li>
        <PageBuyAutoRefreshTemplateAnchor />
      </li>
    </ul>
    <ul class="mt-[16px] m:space-y-[8px] pt:space-y-[8px]">
      <li
        class="rounded-[15px] bg-[--gray-f7] m:space-y-[24px] m:py-[32px] t:gap-x-[24px] tm:p-[24px] tm:px-[16px] pt:flex pt:items-center pt:py-[24px] p:gap-x-[32px] p:px-[40px]"
        v-for="(item, index) in plans"
        :key="`${item.planName}_${index}`"
      >
        <b class="block text-center text-[16px]">{{ item.planName }}</b>
        <ul
          class="flex flex-wrap items-center justify-center m:gap-[6px] t:gap-x-[8px] pt:ml-auto p:gap-x-[16px]"
        >
          <li
            class="flex-1"
            v-for="(time, idx) in item.listTimeSpan"
            :key="`${time}_${idx}_${index}`"
          >
            <BuyMTimeMain
              :text="time"
              :setClass="{
                main: '--h-30 p:--w-85 tm:--w-75',
                text: 'text-[14px]',
              }"
            />
          </li>
        </ul>
        <PageBuyAutoRefreshEditTimeAnchor :data="item" :update="props.update" />
      </li>
    </ul>
    <PageBuyAutoRefreshNote />
  </div>
</template>

<style lang="postcss"></style>
