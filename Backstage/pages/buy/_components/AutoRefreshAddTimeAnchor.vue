<script setup>
const {
  onApiGETRefreshNewPlan,
  onApiGETRefreshAvailablePlans,
  onApiPOSTRefreshSavePlan,
  onAutoRefreshPopup,
  onResetPojectData,
} = useBuyProjectActions()
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const { onCustom, onApiPromise } = useBuyPopupActions()

const props = defineProps({
  update: {
    type: Function,
    default: null,
  },
})

const info = computed(() => autoRefresh.value.info || {})

// 續刊
const onRenewal = async () => {
  const { isSure: isRenewal, item } = await onCustom({
    id: 'popupAutoRefreshRenewal',
    title: '請選擇額度',
    icon: 'icon_quota',
    btns: [
      {
        id: 'cancel',
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        id: 'back',
        label: '上一步',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        id: 'sure',
        label: '確定，使用額度',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: false,
      },
    ],
  })

  if (isRenewal) {
    onApiPromise('open')
    await onApiPOSTRefreshSavePlan()
    onApiPromise('close')

    const { isSure } = await onCustom({
      id: 'popupAutoRefreshSuccess',
      title: '自動刷新',
      icon: 'icon_double_star',
      hasExistClose: false,
      btns: 'alert',
    })

    if (isSure) {
      onApiPromise('open')
      if (props.update) await props.update()
      onApiPromise('close')
    }
  } else if (item.id === 'back') {
    onNewPlan()
  }
}

const onNewPlan = async () => {
  const { hfID } = info.value

  const { status, data } = await onApiGETRefreshNewPlan(hfID)

  if (status === 200) {
    const { isSure: isAddTime, item } = await onCustom({
      id: 'popupAddTime',
      title: '增加刷新次數',
      icon: 'icon_double_star',
      data,
      btns: [
        {
          label: '取消',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'back',
          label: '上一步',
          class: '--border-gray-e5 --text-gray-666',
          type: 'cancel',
          isClose: true,
        },
        {
          id: 'sure',
          label: '確認',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: false,
        },
      ],
    })

    if (isAddTime) {
      onApiPromise('open')
      await onApiGETRefreshAvailablePlans()
      onRenewal()
      onApiPromise('close')
    } else if (item.id === 'back') {
      await onAutoRefreshPopup(autoRefresh.value.info)
    }
  }
}

const onClick = async () => {
  const { hfID } = info.value

  autoRefresh.value.save.apiData.hfID = hfID
  autoRefresh.value.save.apiData.vasID = 0 // 新增傳 0

  onResetPojectData('autoRefresh') // 清空 autoRefresh 選取的資料

  await onNewPlan()
}
</script>

<template>
  <BuyMAnchor
    text="增加刷新次數"
    :config="{
      icon: {
        name: 'icon_plus_circle',
        position: 'left',
      },
    }"
    :setClass="{
      main: '--border-gray-e5 --bg-white --oval --h-30 p:--px-15 tm:--px-8 --text-gray-666',
      text: 'tm:text-[14px] p:text-[16px]',
      icon: 'h-[16px] w-[16px] text-[--gray-999]',
    }"
    @click="onClick"
  />
</template>

<style lang="postcss"></style>
