<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import CasePurpose from '@pages/buy/_components/basic/info/CasePurpose.vue'
import CaseTitle from '@pages/buy/_components/basic/info/CaseTitle.vue'
import Address from '@pages/buy/_components/basic/info/Address.vue'
import CaseType from '@pages/buy/_components/basic/info/CaseType.vue'
import CaseUsage from '@pages/buy/_components/basic/info/CaseUsage.vue'
import Zoing from '@pages/buy/_components/basic/info/Zoing.vue'
import CaseLandNo from '@pages/buy/_components/basic/info/CaseLandNo.vue'
import Floor from '@pages/buy/_components/basic/info/Floor.vue'
import TotalFloor from '@pages/buy/_components/basic/info/TotalFloor.vue'
import CaseAgeIdentify from '@pages/buy/_components/basic/info/CaseAgeIdentify.vue'
import Community from '@pages/buy/_components/basic/info/Community.vue'
import HouseLayout from '@pages/buy/_components/basic/info/HouseLayout.vue'
import HouseAddLayout from '@pages/buy/_components/basic/info/HouseAddLayout.vue'
import Elevator from '@pages/buy/_components/basic/info/Elevator.vue'
import Face from '@pages/buy/_components/basic/info/Face.vue'
import Structure from '@pages/buy/_components/basic/info/Structure.vue'
import BarrierFree from '@pages/buy/_components/basic/info/BarrierFree.vue'

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
    component: CasePurpose,
  },
  {
    id: 'caseTitle',
    isRequired: true,
    label: '物件標題',
    class: 'pt:h-[40px]',
    component: CaseTitle,
  },
  {
    id: 'address',
    isRequired: true,
    label: '地址',
    class: 'pt:h-[40px]',
    component: Address,
  },
  {
    id: 'caseType',
    isRequired: true,
    label: '型態',
    class: 'pt:h-[40px]',
    component: CaseType,
  },
  {
    id: 'caseUsage',
    isRequired: true,
    label: '法定用途',
    class: 'pt:h-[40px]',
    component: CaseUsage,
  },
  {
    id: 'zoing',
    isRequired: true,
    label: '土地分區',
    class: 'p:h-[35px] t:h-[50px]',
    component: Zoing,
  },
  {
    id: 'caseLandNo',
    isRequired: true,
    label: '地號',
    class: 'pt:h-[40px]',
    component: CaseLandNo,
  },
  {
    id: 'floor',
    isRequired: true,
    label: '出售樓層',
    class: 'p:h-[35px] t:h-[50px]',
    component: Floor,
  },
  {
    id: 'totalFloor',
    isRequired: true,
    label: '總樓高',
    class: 'pt:h-[40px]',
    component: TotalFloor,
  },
  {
    id: 'caseAgeIdentify',
    isRequired: true,
    label: '屋齡',
    class: 'p:h-[35px] t:h-[50px]',
    component: CaseAgeIdentify,
  },
  {
    id: 'community',
    isRequired: true,
    label: '社區',
    class: 'p:h-[35px] t:h-[50px]',
    component: Community,
  },
  {
    id: 'houseLayout',
    isRequired: true,
    label: '格局',
    class: 'pt:h-[40px]',
    component: HouseLayout,
  },
  {
    id: 'houseAddLayout',
    isRequired: false,
    label: '加蓋格局',
    class: 'pt:h-[40px]',
    component: HouseAddLayout,
  },
  {
    id: 'elevator',
    isRequired: false,
    label: '電梯',
    class: 'p:h-[35px] t:h-[50px]',
    component: Elevator,
  },
  {
    id: 'face',
    isRequired: false,
    label: '朝向',
    class: 'pt:h-[40px]',
    component: Face,
  },
  {
    id: 'structure',
    isRequired: false,
    label: '建物結構',
    class: 'pt:h-[40px]',
    component: Structure,
  },
  {
    id: 'barrierFree',
    isRequired: false,
    label: '無障礙設施',
    class: 'pt:h-[25px]',
    component: BarrierFree,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
