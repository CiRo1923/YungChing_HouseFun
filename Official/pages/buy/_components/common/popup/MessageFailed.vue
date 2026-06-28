<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
</script>

<template>
  <BuyCommonCustomPopup
    id="popupMessageFailed"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-600 t:--w-460',
    }"
  >
    <p class="rounded-[8px] bg-[--gray-f7] p-[20px] text-[16px] tracking-wider">
      {{ customData.data }}
    </p>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
