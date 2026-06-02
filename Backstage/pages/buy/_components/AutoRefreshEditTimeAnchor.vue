<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const {
  onApiGETRefreshGetPlanInfo,
  onApiPOSTRefreshSavePlan,
  onAutoRefreshPopup,
  onResetPojectData,
} = useBuyProjectActions()
const { onCustom, onApiPromise } = useBuyPopupActions()

const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
  update: {
    type: Function,
    default: null,
  },
})

const onClick = async () => {
  const { hfID, vasID, expireDate } = props.data

  autoRefresh.value.save.apiData.hfID = hfID
  autoRefresh.value.save.apiData.vasID = vasID

  onResetPojectData('autoRefresh') // 清空 autoRefresh 選取的資料

  const { status, data } = await onApiGETRefreshGetPlanInfo()

  if (status === 200) {
    const { listTimeSpan } = data

    autoRefresh.value.save.apiData.listSelectedRefreshTime = listTimeSpan
      .filter((item) => item.isSelected)
      .map((item) => item.timeID)

    const { isSure: isEditTime } = await onCustom({
      id: 'popupEditTime',
      title: `修改時間${expireDate ? ` - ${expireDate} 到期` : ''}`,
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
          label: '確認',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: false,
        },
      ],
    })

    if (isEditTime) {
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
    } else {
      await onAutoRefreshPopup(autoRefresh.value.info)
    }
  }
}
</script>

<template>
  <div class="m:text-center">
    <BuyMAnchor
      text="修改時間"
      :setClass="{
        main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
        text: 'text-[14px]',
      }"
      @click="onClick"
    />
  </div>
</template>

<style lang="stylus"></style>
