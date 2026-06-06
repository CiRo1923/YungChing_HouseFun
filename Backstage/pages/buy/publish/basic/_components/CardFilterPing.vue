<script setup>
import {
  PageBuyPublishBasicPingCaseSqUnitPin,
  PageBuyPublishBasicPingCaseBuildSq,
  PageBuyPublishBasicPingCaseParkingSq,
  PageBuyPublishBasicPingCaseMainSq,
  PageBuyPublishBasicPingCaseAffiliatedSq,
  PageBuyPublishBasicPingCaseLandSq,
  PageBuyPublishBasicPingCaseAmenitieSq,
} from '#components'

const { onCustom } = useBuyPopupActions()
const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
const items = computed(() => {
  return [
    {
      id: 'caseSqUnitPin',
      isRequired: false,
      label: '顯示單位',
      class: 'p:h-[35px]',
      component: PageBuyPublishBasicPingCaseSqUnitPin,
      hasEmits: false,
    },
    {
      id: 'caseBuildSq',
      isRequired: true,
      label: '登記坪數',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPingCaseBuildSq,
      hasEmits: false,
    },
    {
      id: 'caseParkingSq',
      isRequired: false,
      label: '車位坪數',
      class: 'p:h-[40px]',
      hidden: ['7'], // 7: 車位
      component: PageBuyPublishBasicPingCaseParkingSq,
      hasEmits: false,
    },
    {
      id: 'caseMainSq',
      isRequired: false,
      label: '主建物',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPingCaseMainSq,
      hasEmits: false,
    },
    {
      id: 'caseAffiliatedSq',
      isRequired: false,
      label: '附屬建物',
      class: 'p:h-[40px]',
      hidden: ['7'], // 7: 車位
      component: PageBuyPublishBasicPingCaseAffiliatedSq,
      hasEmits: false,
    },
    {
      id: 'caseAmenitieSq',
      isRequired: false,
      label: '公設',
      class: 'p:h-[40px]',
      hidden: ['7'], // 7: 車位
      component: PageBuyPublishBasicPingCaseAmenitieSq,
      hasEmits: false,
    },
    {
      id: 'caseLandSq',
      isRequired: false,
      label: '土地坪數',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPingCaseLandSq,
      hasEmits: false,
    },
  ]
})

const onPopupTitleDeed = async () => {
  await onCustom({
    id: 'popupTitleDeed',
    title: '權狀書說明',
    icon: 'icon_book',
    btns: 'alert',
  })
}

const visibleItems = computed(() => {
  return items.value.filter((item) => {
    const isHidden = item.hidden?.includes(casePurposeToken.value)
    const isVisibleOnly = item.visible?.length

    if (isHidden) return false

    if (isVisibleOnly) {
      return item.visible.includes(casePurposeToken.value)
    }

    return true
  })
})
</script>

<template>
  <!-- <pre>
    {{ pingData }}
  </pre> -->
  <PageBuyPublishBasicCardFilter :title="props.title" :items="visibleItems">
    <template #tools>
      <div class="m:mt-[8px] m:text-center">
        <BuyMAnchor
          text="權狀書說明"
          :config="{
            icon: {
              position: 'left',
              name: 'icon_circle_question',
            },
          }"
          :setClass="{
            main: '--text-green-6a2d underline',
            icon: 'h-[18px] w-[18px] text-[--gray-666]',
          }"
          @click="onPopupTitleDeed"
        />
      </div>
    </template>
  </PageBuyPublishBasicCardFilter>
</template>

<style></style>
