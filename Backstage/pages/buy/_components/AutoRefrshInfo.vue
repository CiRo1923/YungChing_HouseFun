<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const { onApiGETRefreshGetPlanInfo, onAutoRefreshPopup } = useBuyProjectActions()
// const popup = usePopupStore()
// const { customData } = storeToRefs(popup)
const { onCustom } = useBuyPopupActions()

const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
const events = shallowReadonly([
  {
    label: '增加刷新次數',
    icon: 'icon_plus_circle',
    onClick: () => {
      console.log('增加刷新次數')
    },
  },
  {
    label: '套用範本設定',
    icon: 'icon_copy',
    onClick: () => {
      console.log('套用範本設定')
    },
  },
])

const note = shallowReadonly({
  label: 'disc',
  items: [
    {
      item: '於刷新有效期內，每日的設定時間，系統將自動刷新物件的排序。',
    },
    {
      item: '刷新的物件，在設定的時間將會被排在物件列表的較前面的順序。',
    },
    {
      item: '搭配物件黃金曝光，讓您的物件更容易被看到！',
    },
    {
      item: '更改 / 增加刷新時間後，將於隔日生效。',
    },
  ],
})

const info = computed(() => autoRefresh.value.info || {})
const plans = computed(() => autoRefresh.value.plans || {})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const onEditTimeClick = async (item) => {
  const { hfid, vasid, expireDate } = item

  console.log(item)

  autoRefresh.value.planInfo.apiData.hfID = hfid
  autoRefresh.value.planInfo.apiData.vasID = vasid

  console.log(autoRefresh.value.planInfo.apiData)

  // onApiGETRefreshGetPlanInfo
  const isEditTime = await onCustom({
    id: 'popupEditTime',
    title: `修改時間${expireDate ? ` - ${expireDate} 到期` : ''}`,
    icon: 'icon_double_star',
    btns: 'confirm',
  })

  if (isEditTime) {
    console.log('edit!!')
  } else {
    console.log(autoRefresh.value.info)
    await onAutoRefreshPopup(autoRefresh.value.info)
  }
}
</script>

<template>
  <div class="mx-auto p:max-w-[800px]" :class="setClass.main">
    <PageBuyPublishLabelText label="現有刷新次數" icon="icon_double_star" />
    <p class="text-center text-[--gray-666] tm:mt-[8px] tm:text-[14px] p:mt-[16px] p:text-[16px]">
      共 <b class="font-semibold text-[--orange-e646]">{{ info.currentCount }}</b> 次
    </p>
    <ul class="mt-[24px] flex flex-wrap items-center justify-center gap-[10px]">
      <li v-for="(event, idx) in events" :key="`${event.label}_${idx}`">
        <BuyMAnchor
          :text="event.label"
          :config="{
            icon: {
              name: event.icon,
              position: 'left',
            },
          }"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-30 p:--px-15 tm:--px-8 --text-gray-666',
            text: 'tm:text-[14px] p:text-[16px]',
            icon: 'h-[16px] w-[16px] text-[--gray-999]',
          }"
          @click="event.onClick"
        />
      </li>
    </ul>
    <ul class="mt-[16px]">
      <li
        class="rounded-[15px] bg-[--gray-f7] m:space-y-[24px] m:py-[32px] m:text-center t:gap-x-[24px] tm:p-[24px] tm:px-[16px] pt:flex pt:items-center pt:py-[24px] p:gap-x-[32px] p:px-[40px]"
        v-for="(item, index) in plans"
        :key="`${item.planName}_${index}`"
      >
        <b class="block text-[16px]">{{ item.planName }}</b>
        <ul class="flex items-center justify-center tm:gap-x-[8px] pt:ml-auto p:gap-x-[16px]">
          <li
            class="flex-1"
            v-for="(time, idx) in item.listTimeSpan"
            :key="`${time}_${idx}_${index}`"
          >
            <BuyMTagDefault
              :text="time"
              :setClass="{
                main: '--h-30 p:--px-15 tm:--px-8 --bg-orange-feea w-full',
                text: 'text-[14px] font-semibold',
              }"
            />
          </li>
        </ul>

        <BuyMAnchor
          text="修改時間"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
            text: 'text-[14px]',
          }"
          @click="onEditTimeClick(item)"
        />
      </li>
    </ul>
    <BuyMItemMain
      :data="note"
      :setClass="{
        main: 'mt-[24px] text-[14px] text-[--gray-666]',
        item: 'tracking-wider',
      }"
    />
  </div>
</template>

<style lang="postcss"></style>
