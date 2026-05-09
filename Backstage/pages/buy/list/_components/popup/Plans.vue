<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

import AvailablePlans from '@pages/buy/list/_components/common/AvailablePlans.vue'

import useBuyListActions from '@stores/buy/composables/useListActions.js'

const { selectCount } = useBuyListActions()
</script>

<template>
  <CustomPopup
    id="popupPlans"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <p class="text-[14px] text-[--gray-666] p:mb-[24px]">
      已選擇 <span class="text-[--orange-e646]">{{ selectCount }}</span> 個物件，需要使用
      <span class="text-[--orange-e646]">{{ selectCount }}</span> 個刊登額度
    </p>
    <AvailablePlans />
  </CustomPopup>
</template>

<style lang="postcss"></style>
