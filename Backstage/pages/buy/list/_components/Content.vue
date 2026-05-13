<script setup>
import Functions from '@pages/buy/list/_components/functions/Main.vue'
import Item from '@pages/buy/list/_components/item/Main.vue'

import { useBuyListStore } from '@stores/buy/list.js'
import useBuyProjectActions from '@stores/buy/composables/useProjectActions.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const {
  onApiPOSTPublishRenewal,
  onResetPojectData,
  onApiPOSTPublishSubmit,
  onApiPOSTRealEstateRestoreToOnline,
  onApiGETPublishGetPublishResponse,
  onGoldenPopup,
} = useBuyProjectActions()
const buyList = useBuyListStore()
const { datas, pagination } = storeToRefs(buyList)
const { selectItems, selectCount, onApiPOSTRealEstateOffline, onApiPOSTRealEstateDeal } =
  useBuyListActions()
const { onAlert, onCustom, onApiPromise } = useBuyPopupActions()
const route = useRoute()
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

const onPopupRenewal = async (data) => {
  return await onCustom({
    id: 'popupRenewal',
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
  onResetPojectData('renewal')

  const isSure = await onPopupRenewal(objectData)

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
  const selectedIds = new Set(selectItems.value)
  const hasOfflineInfo = !!datas.value[0]?.caseOfflineInfo
  const onSelectedPublishItems = () => {
    if (objectData) return [objectData]

    return datas.value.filter((item) => selectedIds.has(item.hfID) && item._checked.publish)
  }
  const selectedPublishItems = onSelectedPublishItems()

  const renewalIDs = selectedPublishItems
    .filter((item) => !hasOfflineInfo || item._checked.isExpired)
    .map((item) => item.hfID)

  const onlineIDs = hasOfflineInfo
    ? selectedPublishItems
        .filter((item) => objectData || !item._checked.isExpired)
        .map((item) => item.hfID)
    : []

  onResetPojectData('renewal')
  const isSure = await onPopupRenewal(objectData)

  if (!isSure) return

  onApiPromise('open')

  let isSuccess = false
  try {
    const apiTasks = []

    if (renewalIDs.length) {
      apiTasks.push(onApiPOSTPublishSubmit(renewalIDs))
    }

    if (onlineIDs.length) {
      apiTasks.push(onApiPOSTRealEstateRestoreToOnline(onlineIDs))
    }

    const results = await Promise.all(apiTasks)

    isSuccess = results.every(({ status }) => status === 200)

    if (objectData) {
      await onApiGETPublishGetPublishResponse(objectData.hfID)
    }

    await new Promise((resolve) => {
      emits('update', resolve)
    })
  } finally {
    onApiPromise('close')
  }

  if (!isSuccess) return

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
          label: '前往刊登管理',
          class: '--bg-green-6a2d --text-white',
          type: 'sure',
          isClose: true,
        },
      ],
    })

    if (isFinish) {
      router.push({
        name: 'buy-list-publish',
        query: {
          pg: 1,
        },
      })
    }

    return
  }

  onAlert({
    title: '物件刊登完成',
    icon: 'icon_check_solid',
    content: '請確認物件是否已刊登',
  })
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

// 黃金曝光
const onGoldenClick = async (objectData) => {
  await onGoldenPopup(objectData)
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
          @click:golden="onGoldenClick"
        >
          <slot
            :item="item"
            :renewalFun="onRenewalClick"
            :publishFun="onPublishClick"
            :dealFun="onDealClick"
            :goldenFun="onGoldenClick"
          />
        </Item>
        <!-- <pre>
          {{ item }}
        </pre> -->
      </li>
    </ul>
    <BuyMPagination
      :route="route"
      :config="{
        nowPage: pagination.page,
        itemsPage: pagination.pageSize,
        pageNumber: 5,
        total: pagination.total,
        queryKey: 'pg',
      }"
      :setClass="{
        main: 'tm:mt-[32px] p:mt-[40px]',
      }"
    />
  </BuyMCardDefault>
  <!-- <pre>
    {{ datas }}
  </pre> -->
</template>

<style lang="postcss"></style>
