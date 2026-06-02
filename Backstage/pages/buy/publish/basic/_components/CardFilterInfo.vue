<script setup>
import {
  PageBuyPublishBasicInfoCasePurpose,
  PageBuyPublishBasicInfoCaseTitle,
  PageBuyPublishBasicInfoAddress,
  PageBuyPublishBasicInfoCaseType,
  PageBuyPublishBasicInfoCaseUsage,
  PageBuyPublishBasicInfoZoing,
  PageBuyPublishBasicInfoCaseLandNo,
  PageBuyPublishBasicInfoFloor,
  PageBuyPublishBasicInfoTotalFloor,
  PageBuyPublishBasicInfoCaseAgeIdentify,
  PageBuyPublishBasicInfoCommunity,
  PageBuyPublishBasicInfoHouseLayout,
  PageBuyPublishBasicInfoHouseAddLayout,
  PageBuyPublishBasicInfoElevator,
  PageBuyPublishBasicInfoFace,
  PageBuyPublishBasicInfoStructure,
  PageBuyPublishBasicInfoBarrierFree,
} from '#components'

const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const emits = defineEmits(['change'])
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'casePurpose',
    isRequired: true,
    label: '現況',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoCasePurpose,
    hasEmits: true,
  },
  {
    id: 'caseTitle',
    isRequired: true,
    label: '物件標題',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseTitle,
    hasEmits: false,
  },
  {
    id: 'address',
    isRequired: true,
    label: '地址',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoAddress,
    hasEmits: false,
  },
  {
    id: 'caseType',
    isRequired: true,
    label: '型態',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseType,
    hasEmits: false,
  },
  {
    id: 'caseUsage',
    isRequired: true,
    label: '法定用途',
    class: 'pt:h-[40px]',
    hidden: [6],
    component: PageBuyPublishBasicInfoCaseUsage,
    hasEmits: false,
  },
  {
    id: 'zoing',
    isRequired: true,
    label: '土地分區',
    class: 'p:h-[35px] t:h-[50px]',
    hidden: [5], // 5 車位;
    component: PageBuyPublishBasicInfoZoing,
    hasEmits: false,
  },
  {
    id: 'caseLandNo',
    isRequired: true,
    label: '地號',
    class: 'pt:h-[40px]',
    visible: [6], // 6 土地;
    component: PageBuyPublishBasicInfoCaseLandNo,
    hasEmits: false,
  },
  {
    id: 'floor',
    isRequired: true,
    label: '出售樓層',
    class: 'p:h-[35px] t:h-[50px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoFloor,
    hasEmits: false,
  },
  {
    id: 'totalFloor',
    isRequired: true,
    label: '總樓高',
    class: 'pt:h-[40px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoTotalFloor,
    hasEmits: false,
  },
  {
    id: 'caseAgeIdentify',
    isRequired: true,
    label: '屋齡',
    class: 'p:h-[35px] t:h-[50px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoCaseAgeIdentify,
    hasEmits: false,
  },
  {
    id: 'community',
    isRequired: true,
    label: '社區',
    class: 'p:h-[35px] t:h-[50px]',
    hidden: [6], // 6 土地;
    component: PageBuyPublishBasicInfoCommunity,
    hasEmits: false,
  },
  {
    id: 'houseLayout',
    isRequired: true,
    label: '格局',
    class: 'pt:h-[40px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoHouseLayout,
    hasEmits: false,
  },
  {
    id: 'houseAddLayout',
    isRequired: false,
    label: '加蓋格局',
    class: 'pt:h-[40px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoHouseAddLayout,
    hasEmits: false,
  },
  {
    id: 'elevator',
    isRequired: false,
    label: '電梯',
    class: 'p:h-[35px] t:h-[50px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoElevator,
    hasEmits: false,
  },
  {
    id: 'face',
    isRequired: false,
    label: '朝向',
    class: 'pt:h-[40px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoFace,
    hasEmits: false,
  },
  {
    id: 'structure',
    isRequired: false,
    label: '建物結構',
    class: 'pt:h-[40px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoStructure,
    hasEmits: false,
  },
  {
    id: 'barrierFree',
    isRequired: false,
    label: '無障礙設施',
    class: 'pt:h-[25px]',
    hidden: [5, 6], // 5 車位; 6 土地;
    component: PageBuyPublishBasicInfoBarrierFree,
    hasEmits: false,
  },
])

const visibleItems = computed(() => {
  const casePurposeToken = apiData.value.caseInfo.casePurposeToken

  return items.filter((item) => {
    const isHidden = item.hidden?.includes(casePurposeToken)
    const isVisibleOnly = item.visible?.length

    if (isHidden) return false

    if (isVisibleOnly) {
      return item.visible.includes(casePurposeToken)
    }

    return true
  })
})

const onChange = (item) => {
  emits('change', item)
}
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="visibleItems" @change="onChange" />
</template>

<style></style>
