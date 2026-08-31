<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const {
  onApiGETRefreshGetPlanInfo,
  onApiPOSTRefreshSavePlan,
  onAutoRefreshPopup,
  onAutoRefreshSuccess,
  onResetPojectData,
} = useBuyProjectActions()
const { onCustom, onApiPromise } = usePopupActions()

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
  const { hfID, vasID } = props.data

  autoRefresh.value.save.apiData.hfID = hfID
  autoRefresh.value.save.apiData.vasID = vasID

  onResetPojectData('autoRefresh') // 清空 autoRefresh 選取的資料

  const { status, data } = await onApiGETRefreshGetPlanInfo()

  if (status !== 200) return

  const { listTimeSpan } = data

  autoRefresh.value.save.apiData.listSelectedRefreshTime = listTimeSpan
    .filter((item) => item.isSelected)
    .map((item) => item.timeID)

  const { isSure: isEditTime } = await onCustom({
    id: 'popupAutoRefreshEditTime',
    title: '修改時間',
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

  if (!isEditTime) {
    await onAutoRefreshPopup(autoRefresh.value.info)
    return
  }

  onApiPromise('open')
  await onApiPOSTRefreshSavePlan()
  onApiPromise('close')

  await onAutoRefreshSuccess(props.update)

  // 成功後回到「自動刷新設定」popup
  await onAutoRefreshPopup(autoRefresh.value.info)
}
</script>

<template>
  <!-- 同一列的時間 Badge 會撐開版面,這顆按鈕不能被壓縮,否則文字會被擠到換行 -->
  <div class="m:text-center pt:shrink-0">
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
