<script setup>
import Functions from '@pages/buy/list/_components/functions/Main.vue'
import Item from '@pages/buy/list/_components/item/Main.vue'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const { onApiPOSTVasPublishRenewal, onResetApiDataRenewal } = useBuyProjectActions()
const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)
const { selectItems, onApiPOSTRealEstateOffline } = useBuyListActions()
const { onAlert, onCustom, onApiPromise } = useBuyPopupActions()

const emits = defineEmits(['update'])
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
const onRenewalClick = async (data) => {
  onResetApiDataRenewal()

  const isCustom = await onCustom({
    id: 'popupPlans',
    title: '請選擇額度',
    data,
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
        isClose: false,
      },
    ],
  })

  if (isCustom) {
    onApiPromise('open')

    const hfIDs = data ? [data.hfID] : selectItems.value
    const { data: apiData } = await onApiPOSTVasPublishRenewal(hfIDs)
    await new Promise((resolve) => {
      emits('update', resolve)
    })

    onApiPromise('close')
    const isAllSuccess = apiData.every((item) => item.isSuccess)
    const error = apiData.find((item) => item.errorMessage)
    console.log(apiData)

    if (isAllSuccess) {
      onAlert({
        title: '物件續刊完成',
        content: '請確認物件是否已續刊',
      })
    } else {
      onAlert({
        content: error.errorMessage,
      })
    }
  }
}

const onPublishClick = () => {
  console.log('onPublishClick')
}

const onRemovedClick = async (data) => {
  const isCustom = await onCustom({
    id: 'popupRemoved',
    title: '下架物件',
    data,
    icon: 'icon_circle_exclamation',
    btns: 'confirm',
  })

  if (isCustom) {
    onApiPromise('open')

    const hfIDs = data ? [data.hfID] : selectItems.value

    await onApiPOSTRealEstateOffline(hfIDs)
    await new Promise((resolve) => {
      emits('update', resolve)
    })

    onApiPromise('close')

    onAlert({
      title: '物件下架完成',
      content: '請確認物件是否已下架',
    })
  }
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
      @click:publish="onPublishClick"
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
          @click:publish="onPublishClick"
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
