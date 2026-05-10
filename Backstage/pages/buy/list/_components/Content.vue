<script setup>
import Functions from '@pages/buy/list/_components/functions/Main.vue'
import Item from '@pages/buy/list/_components/item/Main.vue'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const {
  onApiPOSTPublishRenewal,
  onResetApiDataRenewal,
  onApiPOSTPublishSubmit,
  onApiPOSTPublishGetPublishResponse,
} = useBuyProjectActions()
const buyList = useBuyListStore()
const { datas } = storeToRefs(buyList)
const {
  selectItems,
  selectCount,
  onApiPOSTRealEstateOffline,
  onApiPOSTRealEstateDeal,
  onSyncCheckedDatas,
} = useBuyListActions()
const { onAlert, onConfirm, onCustom, onApiPromise } = useBuyPopupActions()
const router = useRouter()

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

const onPopupPlans = async (data) => {
  return await onCustom({
    id: 'popupPlans',
    title: '請選擇額度',
    data,
    icon: 'icon_quota',
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
}

// 續刊
const onRenewalClick = async (objectData) => {
  onResetApiDataRenewal()

  const isSure = await onPopupPlans(objectData)

  if (isSure) {
    onApiPromise('open')

    const hfIDs = objectData ? [objectData.hfID] : selectItems.value
    const { status, data } = await onApiPOSTPublishRenewal(hfIDs)
    await new Promise((resolve) => {
      emits('update', resolve)
    })

    onApiPromise('close')

    if (status === 200) {
      const isAllSuccess = data.every((item) => item.isSuccess)
      const error = data.find((item) => item.errorMessage)

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
}

// 刊登
const onPublishClick = async (objectData) => {
  const invalidIds = new Set(
    datas.value
      .filter((item) => selectItems.value.includes(item.hfID) && item._checked.publish === false)
      .map((item) => item.hfID)
  )
  const result =
    objectData || selectCount.value === 1
      ? {
          value: true,
          datas: objectData ? [objectData.hfID] : selectItems.value,
        }
      : {
          value: invalidIds.size === 0,
          datas: selectItems.value.filter((id) => !invalidIds.has(id)),
        }

  // 批次刊登中有未符合條件的告知使用者
  if (!result.value) {
    const isConfirm = await onConfirm({
      title: '刊登提醒',
      content:
        '批次刊登時有無法達成刊登條件的物件<br / >是否自動取消未達成批次刊登的物件？<br />取消後請自行調整批次刊登物件',
      setClass: {
        main: 'p:--w-800 t:--w-600',
      },
    })

    // 選擇確認 自動移除未符合的物件
    if (isConfirm) {
      onSyncCheckedDatas(result.datas)
    }
  }

  onResetApiDataRenewal()
  const isSure = await onPopupPlans(objectData)

  if (isSure) {
    onApiPromise('open')

    const hfIDs = objectData ? [objectData.hfID] : selectItems.value
    const { status } = await onApiPOSTPublishSubmit(hfIDs)
    if (objectData) {
      await onApiPOSTPublishGetPublishResponse(objectData.hfID)
    }
    await new Promise((resolve) => {
      emits('update', resolve)
    })

    onApiPromise('close')

    if (status === 200) {
      if (objectData || selectCount.value === 1) {
        const isFinish = await onCustom({
          id: 'popupFinish',
          title: '物件刊登完成',
          data: objectData,
          icon: 'icon_check_solid',
          btns: [
            {
              label: '返回',
              class: '--border-gray-e5 --text-gray-666',
              type: 'cancel',
              isClose: true,
            },
            {
              label: '前往刊登',
              class: '--bg-green-6a2d --text-white',
              type: 'sure',
              isClose: true,
            },
          ],
        })

        if (isFinish) {
          console.log(1)
          router.push({
            name: 'buy-list-publish',
            query: {
              pg: 1,
            },
          })
        }
      } else {
        onAlert({
          title: '物件刊登完成',
          icon: 'icon_check_solid',
          content: '請確認物件是否已刊登',
        })
      }
    }
  }
}

// 下架
const onOfflineClick = async (objectData) => {
  const isOffline = await onCustom({
    id: 'popupOffline',
    title: '下架物件',
    data: objectData,
    icon: 'icon_circle_exclamation',
    btns: 'confirm',
  })

  if (isOffline) {
    onApiPromise('open')

    const hfIDs = objectData ? [objectData.hfID] : selectItems.value

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

// 成交
const onDealClick = async (objectData) => {
  const isDeal = await onCustom({
    id: 'popupDeal',
    title: '成交設定',
    data: objectData,
    icon: 'icon_smile',
    btns: [
      {
        label: '取消',
        class: '--border-gray-e5 --text-gray-666',
        type: 'cancel',
        isClose: true,
      },
      {
        label: '設定成交',
        class: '--bg-green-6a2d --text-white',
        type: 'sure',
        isClose: false,
      },
    ],
  })

  if (isDeal) {
    onApiPromise('open')

    const hfIDs = objectData ? [objectData.hfID] : selectItems.value
    await onApiPOSTRealEstateDeal(hfIDs)
    await new Promise((resolve) => {
      emits('update', resolve)
    })

    onApiPromise('close')
  }
}

// 複製資料
const onCopyClick = () => {
  console.log('onCopyClick')
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
      @click:offline="onOfflineClick"
      @click:deal="onDealClick"
      @click:copy="onCopyClick"
      v-if="hasFunEventsItem"
    />
    <ul class="divide-y-[1px] divide-[--gray-e5] border-b-[1px] border-b-[--gray-e5]">
      <li
        class="transition-colors duration-300 tm:py-[24px] p:px-[16px] p:py-[40px]"
        :class="{ 'bg-[--gray-f7]': item._checked.value }"
        v-for="(item, index) in datas"
        :key="`${item.hfID}_${index}`"
      >
        <Item
          :data="item"
          :eventsItems="contentEventsItem"
          v-model:checked="item._checked.value"
          @click:publish="onPublishClick"
          @click:renewal="onRenewalClick"
          @click:offline="onOfflineClick"
          @click:deal="onDealClick"
        >
          <slot
            :item="item"
            :renewalFun="onRenewalClick"
            :publishFun="onPublishClick"
            :dealFun="onDealClick"
          />
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
