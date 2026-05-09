<script setup>
import Functions from '@pages/buy/list/_components/functions/Main.vue'
import Item from '@pages/buy/list/_components/item/Main.vue'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const { onResetApiDataRenewal } = useBuyProjectActions()
const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)

const { onCustom } = useBuyPopupActions()
const props = defineProps({
  funEventsItem: {
    type: Array,
    default: () => [],
  },
  contentEventsItem: {
    type: Array,
    default: () => [],
  },
})

const hasFunEventsItem = computed(() => props.funEventsItem && props.funEventsItem.length !== 0)
const onRenewalClick = async () => {
  onResetApiDataRenewal()

  const isCustom = await onCustom({
    id: 'popupPlans',
    title: '請選擇額度',
    icon: 'icon_book',
    btns: [
      {
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        label: '確認續刊',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: true,
      },
    ],
  })

  console.log(isCustom)
  console.log('content planes')

  if (isCustom) {
    console.log('ok')
  }
}

const onRemovedClick = () => {
  console.log('onRemovedClick')
}

const onDoneClick = () => {
  console.log('onDoneClick')
}
</script>

<template>
  <BuyMCardDefault
    :setClass="{
      main: 'p:mt-[32px]',
    }"
  >
    <Functions
      :eventsItems="props.funEventsItem"
      @click:renewal="onRenewalClick"
      @click:removed="onRemovedClick"
      @click:done="onDoneClick"
      v-if="hasFunEventsItem"
    />
    <ul class="divide-y-[1px] divide-[--gray-e5] border-b-[1px] border-b-[--gray-e5]">
      <li
        class="transition-colors duration-300 p:px-[16px] p:py-[40px]"
        :class="{ 'bg-[--gray-f7]': item._isSelect }"
        v-for="(item, index) in datas"
        :key="`${item.hfID}_${index}`"
      >
        <Item
          :data="item"
          :eventsItems="contentEventsItem"
          v-model:isSelect="item._isSelect"
          @click:renewal="onRenewalClick"
          @click:removed="onRemovedClick"
          @click:done="onDoneClick"
        >
          <slot :item="item" :renewalFun="onRenewalClick" />
        </Item>
        <!-- <pre>
          {{ item }}
        </pre> -->
      </li>
    </ul>
  </BuyMCardDefault>
  <!-- <pre>
    {{ datas }}
  </pre> -->
</template>

<style lang="postcss"></style>
