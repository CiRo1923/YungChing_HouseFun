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
  },
  {
    id: 'caseTitle',
    isRequired: true,
    label: '物件標題',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseTitle,
  },
  {
    id: 'address',
    isRequired: true,
    label: '地址',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoAddress,
  },
  {
    id: 'caseType',
    isRequired: true,
    label: '型態',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseType,
  },
  {
    id: 'caseUsage',
    isRequired: true,
    label: '法定用途',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseUsage,
  },
  {
    id: 'zoing',
    isRequired: true,
    label: '土地分區',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoZoing,
  },
  {
    id: 'caseLandNo',
    isRequired: true,
    label: '地號',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoCaseLandNo,
  },
  {
    id: 'floor',
    isRequired: true,
    label: '出售樓層',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoFloor,
  },
  {
    id: 'totalFloor',
    isRequired: true,
    label: '總樓高',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoTotalFloor,
  },
  {
    id: 'caseAgeIdentify',
    isRequired: true,
    label: '屋齡',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoCaseAgeIdentify,
  },
  {
    id: 'community',
    isRequired: true,
    label: '社區',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoCommunity,
  },
  {
    id: 'houseLayout',
    isRequired: true,
    label: '格局',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoHouseLayout,
  },
  {
    id: 'houseAddLayout',
    isRequired: false,
    label: '加蓋格局',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoHouseAddLayout,
  },
  {
    id: 'elevator',
    isRequired: false,
    label: '電梯',
    class: 'p:h-[35px] t:h-[50px]',
    component: PageBuyPublishBasicInfoElevator,
  },
  {
    id: 'face',
    isRequired: false,
    label: '朝向',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoFace,
  },
  {
    id: 'structure',
    isRequired: false,
    label: '建物結構',
    class: 'pt:h-[40px]',
    component: PageBuyPublishBasicInfoStructure,
  },
  {
    id: 'barrierFree',
    isRequired: false,
    label: '無障礙設施',
    class: 'pt:h-[25px]',
    component: PageBuyPublishBasicInfoBarrierFree,
  },
])
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items" />
</template>

<style></style>
