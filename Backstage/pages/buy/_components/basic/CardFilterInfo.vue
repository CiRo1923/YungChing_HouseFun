<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

import CasePurpose from '@pages/buy/_components/basic/Info/CasePurpose.vue'
import CaseTitle from '@pages/buy/_components/basic/Info/CaseTitle.vue'
import Address from '@pages/buy/_components/basic/Info/Address.vue'
import CaseType from '@pages/buy/_components/basic/Info/CaseType.vue'
import CaseUsage from '@pages/buy/_components/basic/Info/CaseUsage.vue'
import Zoing from '@pages/buy/_components/basic/Info/Zoing.vue'
import CaseLandNo from '@pages/buy/_components/basic/Info/CaseLandNo.vue'
import Floor from '@pages/buy/_components/basic/Info/Floor.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options, apiData } = storeToRefs(buyProject)

const items = shallowReadonly([
  {
    id: 'casePurpose',
    label: '現況',
    class: 'p:h-[35px]',
    component: CasePurpose,
  },
  {
    id: 'caseTitle',
    label: '物件標題',
    class: 'p:h-[40px]',
    component: CaseTitle,
  },
  {
    id: 'address',
    label: '地址',
    class: 'p:h-[40px]',
    component: Address,
  },
  {
    id: 'caseType',
    label: '型態',
    class: 'p:h-[40px]',
    component: CaseType,
  },
  {
    id: 'caseUsage',
    label: '法定用途',
    class: 'p:h-[40px]',
    component: CaseUsage,
  },
  {
    id: 'zoing',
    label: '土地分區',
    class: 'p:h-[35px]',
    component: Zoing,
  },
  {
    id: 'caseLandNo',
    label: '地號',
    class: 'p:h-[40px]',
    component: CaseLandNo,
  },
  {
    id: 'floor',
    label: '出售樓層',
    class: 'p:h-[35px]',
    component: Floor,
  },
])
</script>

<template>
  <CardFilter title="基本資料">
    <!-- <pre>{{ apiData }}</pre> -->
    <!-- <pre>{{ options.city }}</pre> -->
    <ul class="tm:space-y-[40px] p:space-y-[24px]">
      <li
        class="tm:space-y-[12px] p:flex p:gap-x-[8px]"
        v-for="(item, index) in items"
        :key="`${item.id}_${index}`"
      >
        <FormLabel
          :label="item.label"
          :setClass="{
            main: ['shrink-0 p:flex p:w-[100px] p:items-center', item.class],
          }"
        />
        <component :is="item.component" />
      </li>
      <!-- <li class="p:flex">
        <FormLabel
          label="總樓高"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="屋齡"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="社區"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="格局"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="加蓋格局"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="電梯"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="朝向"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="建物結構"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <FormLabel
          label="無障礙設施"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li> -->
    </ul>
  </CardFilter>
</template>

<style></style>
