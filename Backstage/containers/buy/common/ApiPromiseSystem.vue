<script setup>
const popup = usePopupStore()
const { apiPromiseData } = storeToRefs(popup)
</script>

<template>
  <BuyMPopup id="apiPromiseSystem">
    <CommonMLoadingContainer>
      <p class="text-center" v-html="apiPromiseData.content" />
    </CommonMLoadingContainer>
  </BuyMPopup>
</template>

<style></style>
