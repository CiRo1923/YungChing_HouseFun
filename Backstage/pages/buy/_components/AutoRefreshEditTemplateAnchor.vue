<script setup>
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const {
  onApiGETRefreshTemplateGetTemplateInfo,
  onApiPOSTRefreshTemplateSaveTemplate,
  onAutoRefreshTemplateFlow,
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
  const { templateName, templateID, isCustom } = props.data

  autoRefresh.value.templateSaveTime.apiData.templateName = templateName
  autoRefresh.value.templateSaveTime.apiData.templateID = templateID
  autoRefresh.value.templateSaveTime.apiData.isCustom = isCustom

  const { status, data } = await onApiGETRefreshTemplateGetTemplateInfo()

  if (status !== 200) return

  const { listTImeSpan } = data

  autoRefresh.value.templateSaveTime.apiData.listSelectedRefreshTime = listTImeSpan
    .filter((item) => item.isSelected)
    .map((item) => item.timeID)

  const { isSure: isTemplateEditTime, item } = await onCustom({
    id: 'popupAutoRefreshTemplateEditTime',
    title: props.data.templateName,
    icon: 'icon_pen_underline',
    data,
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
        label: '確認',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: false,
      },
    ],
  })

  if (!isTemplateEditTime) {
    // 上一步 → 回到選擇範本並重新進入完整套用流程
    if (item.id === 'back') await onAutoRefreshTemplateFlow(props.update)
    return
  }

  onApiPromise('open')
  await onApiPOSTRefreshTemplateSaveTemplate()
  onApiPromise('close')

  // 編輯儲存後回到選擇範本，繼續完整套用流程（確認範本時間 → 續約 → 儲存）
  await onAutoRefreshTemplateFlow(props.update)
}
</script>

<template>
  <!-- {{ props.data }} -->
  <div class="m:shrink-0 m:text-center">
    <BuyMAnchor
      text="編輯"
      :config="{
        icon: {
          name: 'icon_pen_underline',
          position: 'left',
        },
        isDisabled: props.data.isDisabled,
      }"
      :setClass="{
        main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
        text: 'text-[14px]',
        icon: 'h-[18px] w-[18px] p-[2px]',
      }"
      @click="onClick"
    />
  </div>
</template>

<style lang="stylus"></style>
