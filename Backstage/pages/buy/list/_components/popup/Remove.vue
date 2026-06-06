<script setup>
const { searchSelectCount } = useBuyListActions()
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
</script>

<template>
  <BuyCommonCustomPopup
    id="popupRemove"
    :setClass="{
      main: 'p:--w-800 t:--w-600',
    }"
  >
    <div class="space-y-[8px] text-[16px]">
      <p class="font-semibold" v-if="!customData.data">
        已選擇 <span class="text-[--orange-e646]">{{ searchSelectCount }}</span> 筆物件
      </p>
      <p class="text-[--gray-666]">物件刪除後，將無法復原資料</p>
      <p class="font-semibold">
        您確定要<span class="text-[--orange-e646]">刪除</span>選擇的物件嗎？
      </p>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
