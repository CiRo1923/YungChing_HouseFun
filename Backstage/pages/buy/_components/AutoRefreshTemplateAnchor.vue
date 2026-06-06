<script setup>
const {
  onApiGETRefreshAvailablePlans,
  onAutoRefreshTemplatePopup,
  onAutoRefreshTemplateCheckPopup,
  onAutoRefreshTemplateRenewalPopup,
  onAutoRefreshSuccess,
  onApiPOSTRefreshSavePlanTemplate,
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
const selectedIndex = computed(() => autoRefresh.value.templateSave.selectedIndex)
const template = computed(() => autoRefresh.value.templateSave.list || [])
const refreshCount = computed(() => template.value[selectedIndex.value]?.refreshCount ?? 0)
const count = computed(() => refreshCount.value - info.value.currentCount)

const onSaveToSussess = async () => {
  onApiPromise('open')
  await onApiPOSTRefreshSavePlanTemplate()
  onApiPromise('close')

  await onAutoRefreshSuccess(props.update)
}

const onClick = async () => {
  autoRefresh.value.templateSave.apiData.hfID = info.value.hfID

  onResetPojectData('autoRefreshTemplate') // 清空 autoRefresh 選取的資料

  while (true) {
    // 選擇範本 popup（上一步會自行回到「自動刷新設定」）
    const isTemplate = await onAutoRefreshTemplatePopup(info.value)
    if (!isTemplate) return

    // 確認範本時間 popup
    const check = await onAutoRefreshTemplateCheckPopup()
    if (check === 'back') continue // 上一步 → 回到選擇範本
    if (check !== 'sure') return // 取消 / 關閉 → 結束

    // 續約 popup（次數足夠才需要選額度）
    if (count.value > 0) {
      onApiPromise('open')
      await onApiGETRefreshAvailablePlans()
      onApiPromise('close')

      const renewal = await onAutoRefreshTemplateRenewalPopup()
      if (renewal === 'back') continue // 上一步 → 回到選擇範本
      if (renewal !== 'sure') return // 取消 / 關閉 → 結束
    }

    break
  }

  await onSaveToSussess()
}
</script>

<template>
  <BuyMAnchor
    text="套用範本設定"
    :config="{
      icon: {
        name: 'icon_copy',
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
