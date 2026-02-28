<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import CasePurpose from '@pages/buy/_components/basic/Info/CasePurpose.vue'
import CaseTitle from '@pages/buy/_components/basic/Info/CaseTitle.vue'
import Address from '@pages/buy/_components/basic/Info/Address.vue'
import CaseType from '@pages/buy/_components/basic/Info/CaseType.vue'
import CaseUsage from '@pages/buy/_components/basic/Info/CaseUsage.vue'
import Zoing from '@pages/buy/_components/basic/Info/Zoing.vue'
import CaseLandNo from '@pages/buy/_components/basic/Info/CaseLandNo.vue'
import Floor from '@pages/buy/_components/basic/Info/Floor.vue'
import TotalFloor from '@pages/buy/_components/basic/Info/TotalFloor.vue'
import CaseAgeIdentify from '~/pages/buy/_components/basic/Info/CaseAgeIdentify.vue'
import Community from '@pages/buy/_components/basic/Info/Community.vue'
import HouseLayout from '@pages/buy/_components/basic/Info/HouseLayout.vue'
import HouseAddLayout from '@pages/buy/_components/basic/Info/HouseAddLayout.vue'
import Elevator from '@pages/buy/_components/basic/Info/Elevator.vue'
import Face from '@pages/buy/_components/basic/Info/Face.vue'
import Structure from '@pages/buy/_components/basic/Info/Structure.vue'
import BarrierFree from '@pages/buy/_components/basic/Info/BarrierFree.vue'

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
    class: 'p:h-[35px]',
    component: CasePurpose,
  },
  {
    id: 'caseTitle',
    isRequired: true,
    label: '物件標題',
    class: 'p:h-[40px]',
    component: CaseTitle,
  },
  {
    id: 'address',
    isRequired: true,
    label: '地址',
    class: 'p:h-[40px]',
    component: Address,
  },
  {
    id: 'caseType',
    isRequired: true,
    label: '型態',
    class: 'p:h-[40px]',
    component: CaseType,
  },
  {
    id: 'caseUsage',
    isRequired: true,
    label: '法定用途',
    class: 'p:h-[40px]',
    component: CaseUsage,
  },
  {
    id: 'zoing',
    isRequired: true,
    label: '土地分區',
    class: 'p:h-[35px]',
    component: Zoing,
  },
  {
    id: 'caseLandNo',
    isRequired: true,
    label: '地號',
    class: 'p:h-[40px]',
    component: CaseLandNo,
  },
  {
    id: 'floor',
    isRequired: true,
    label: '出售樓層',
    class: 'p:h-[35px]',
    component: Floor,
  },
  {
    id: 'totalFloor',
    isRequired: true,
    label: '總樓高',
    class: 'p:h-[40px]',
    component: TotalFloor,
  },
  {
    id: 'caseAgeIdentify',
    isRequired: true,
    label: '屋齡',
    class: 'p:h-[35px]',
    component: CaseAgeIdentify,
  },
  {
    id: 'community',
    isRequired: true,
    label: '社區',
    class: 'p:h-[35px]',
    component: Community,
  },
  {
    id: 'houseLayout',
    isRequired: true,
    label: '格局',
    class: 'p:h-[40px]',
    component: HouseLayout,
  },
  {
    id: 'houseAddLayout',
    isRequired: false,
    label: '加蓋格局',
    class: 'p:h-[40px]',
    component: HouseAddLayout,
  },
  {
    id: 'elevator',
    isRequired: false,
    label: '電梯',
    class: 'p:h-[35px]',
    component: Elevator,
  },
  {
    id: 'face',
    isRequired: false,
    label: '朝向',
    class: 'p:h-[40px]',
    component: Face,
  },
  {
    id: 'structure',
    isRequired: false,
    label: '建物結構',
    class: 'p:h-[40px]',
    component: Structure,
  },
  {
    id: 'barrierFree',
    isRequired: false,
    label: '無障礙設施',
    class: 'p:h-[25px]',
    component: BarrierFree,
  },
])
</script>

<template>
  <CardFilter :title="props.title" :items="items" />
</template>

<style></style>
