<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
</script>

<template>
  <BuyCommonCustomPopup
    id="popupEditTime"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    已設定 2 個時間，需設定 3 個自動刷新時段

    <pre>
      {{ customData.data }}
    </pre>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
