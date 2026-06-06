<script setup>
const {
  onApiGETRefreshAvailablePlans,
  onApiPOSTRefreshSavePlan,
  onAutoRefreshAddTimePopup,
  onAutoRefreshRenewalPopup,
  onAutoRefreshSuccess,
  onResetPojectData,
} = useBuyProjectActions()
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const { onApiPromise } = useBuyPopupActions()

const props = defineProps({
  update: {
    type: Function,
    default: null,
  },
})

const info = computed(() => autoRefresh.value.info || {})

const onClick = async () => {
  const { hfID } = info.value

  autoRefresh.value.save.apiData.hfID = hfID
  autoRefresh.value.save.apiData.vasID = 0 // 新增傳 0

  onResetPojectData('autoRefresh') // 清空 autoRefresh 選取的資料

  while (true) {
    // 增加刷新次數 popup（上一步會自行回到「自動刷新設定」）
    const isAddTime = await onAutoRefreshAddTimePopup(info.value)
    if (!isAddTime) return

    onApiPromise('open')
    await onApiGETRefreshAvailablePlans()
    onApiPromise('close')

    // 請選擇額度 popup
    const renewal = await onAutoRefreshRenewalPopup()
    if (renewal === 'back') continue // 上一步 → 回到增加刷新次數
    if (renewal !== 'sure') return // 取消 / 關閉 → 結束

    break
  }

  onApiPromise('open')
  await onApiPOSTRefreshSavePlan()
  onApiPromise('close')

  await onAutoRefreshSuccess(props.update)
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
