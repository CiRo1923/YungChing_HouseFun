<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import Label from '@components/buy/mForm/Label.vue'
import RadiosOval from '@components/buy/mForm/RadiosOval.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
</script>

<template>
  <CardFilter title="基本資料">
    <ul class="tm:space-y-[40px] p:space-y-[24px]">
      <li class="p:flex">
        <Label
          label="現況"
          :setClass="{
            main: 'shrink-0 p:flex p:h-[35px] p:w-[100px] p:items-center',
          }"
        />
        <RadiosOval
          name="casePurpose"
          :options="options.casePurpose"
          :config="{
            schema: {
              label: 'text',
              value: 'code',
            },
          }"
          :rules="{
            required: '12344',
          }"
          :setClass="{
            main: 'grow',
            item: 'tm:w-[70px] p:w-[85px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="物件標題"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="地址"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="型態"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="法定用途"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="土地分區"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="地號"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="出售樓層"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="總樓高"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="屋齡"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="社區"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="格局"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="加蓋格局"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="電梯"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="朝向"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="建物結構"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
      <li class="p:flex">
        <Label
          label="無障礙設施"
          :setClass="{
            main: 'shrink-0 p:w-[100px]',
          }"
        />
      </li>
    </ul>
  </CardFilter>
</template>

<style></style>
