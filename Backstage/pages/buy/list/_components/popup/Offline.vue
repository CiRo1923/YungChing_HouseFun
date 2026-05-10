<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

import { usePopupStore } from '@stores/popup.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'

const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const { selectCount } = useBuyListActions()
</script>

<template>
  <CustomPopup
    id="popupOffline"
    :setClass="{
      main: 'p:--w-800 t:--w-600',
    }"
  >
    <div class="tracking-wider p:space-y-[8px] p:text-[16px]">
      <p v-if="!customData.data">
        <b class="font-semibold">
          已選擇 <span class="text-[--orange-e646]">{{ selectCount }}</span> 筆物件
        </b>
      </p>
      <p class="text-[--gray-666]">
        物件下架後，在刊登效期內再上架不需扣除刊登額度。<br />若在刊登效期後重新上架，則需扣除刊登額度。
      </p>
      <p>
        <b class="font-semibold">
          您確定要將選擇的物件<span class="text-[--orange-e646]">下架</span>嗎？
        </b>
      </p>
    </div>
  </CustomPopup>
</template>

<style lang="postcss"></style>
