<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import CaseSqUnitPin from '@pages/buy/_components/basic/ping/CaseSqUnitPin.vue'
import CaseBuildSq from '@pages/buy/_components/basic/ping/CaseBuildSq.vue'
import CaseParkingSq from '@pages/buy/_components/basic/ping/CaseParkingSq.vue'
import CaseMainSq from '@pages/buy/_components/basic/ping/CaseMainSq.vue'
import CaseAffiliatedSq from '@pages/buy/_components/basic/ping/CaseAffiliatedSq.vue'
import CaseLandSq from '@pages/buy/_components/basic/ping/CaseLandSq.vue'
import CaseAmenitieSq from '@pages/buy/_components/basic/ping/CaseAmenitieSq.vue'

// import { useBuyBasicStore } from '@stores/buy/basic.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const { onCustom } = useBuyPopupActions()
// const buyBasic = useBuyBasicStore()
// const { pingData } = storeToRefs(buyBasic)

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
    component: CaseSqUnitPin,
  },
  {
    id: 'caseBuildSq',
    isRequired: true,
    label: '登記坪數',
    class: 'p:h-[40px]',
    component: CaseBuildSq,
  },
  {
    id: 'caseParkingSq',
    isRequired: false,
    label: '車位坪數',
    class: 'p:h-[40px]',
    component: CaseParkingSq,
  },
  {
    id: 'caseMainSq',
    isRequired: false,
    label: '主建物',
    class: 'p:h-[40px]',
    component: CaseMainSq,
  },
  {
    id: 'caseAffiliatedSq',
    isRequired: false,
    label: '附屬建物',
    class: 'p:h-[40px]',
    component: CaseAffiliatedSq,
  },
  {
    id: 'caseAmenitieSq',
    isRequired: false,
    label: '公設',
    class: 'p:h-[40px]',
    component: CaseAmenitieSq,
  },
  {
    id: 'caseLandSq',
    isRequired: false,
    label: '土地坪數',
    class: 'p:h-[40px]',
    component: CaseLandSq,
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
  <CardFilter :title="props.title" :items="items">
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
            text: 'font-normal',
            icon: 'h-[18px] w-[18px] text-[--gray-666]',
          }"
          @click="onPopupTitleDeed"
        />
      </div>
    </template>
  </CardFilter>
</template>

<style></style>
