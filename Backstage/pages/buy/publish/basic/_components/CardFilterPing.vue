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
// const buyPublish = useBuyPublishStore()
// const { pingData } = storeToRefs(buyPublish)

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const items = shallowReadonly([
  {
    id: 'caseSqUnitPin',
    isRequired: false,
    label: '顯示單位',
    class: 'p:h-[35px]',
    component: PageBuyPublishBasicPingCaseSqUnitPin,
  },
  {
    id: 'caseBuildSq',
    isRequired: true,
    label: '登記坪數',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseBuildSq,
  },
  {
    id: 'caseParkingSq',
    isRequired: false,
    label: '車位坪數',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseParkingSq,
  },
  {
    id: 'caseMainSq',
    isRequired: false,
    label: '主建物',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseMainSq,
  },
  {
    id: 'caseAffiliatedSq',
    isRequired: false,
    label: '附屬建物',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseAffiliatedSq,
  },
  {
    id: 'caseAmenitieSq',
    isRequired: false,
    label: '公設',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseAmenitieSq,
  },
  {
    id: 'caseLandSq',
    isRequired: false,
    label: '土地坪數',
    class: 'p:h-[40px]',
    component: PageBuyPublishBasicPingCaseLandSq,
  },
])

const onPopupTitleDeed = async () => {
  const isCustom = await onCustom({
    id: 'popupTitleDeed',
    title: '權狀書說明',
    icon: 'icon_book',
    btns: 'alert',
  })

  if (isCustom) {
    console.log('ok')
  }
}
</script>

<template>
  <!-- <pre>
    {{ pingData }}
  </pre> -->
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items">
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
