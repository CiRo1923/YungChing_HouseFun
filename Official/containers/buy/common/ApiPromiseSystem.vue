<script setup>
const popup = usePopupStore()
const { apiPromiseData } = storeToRefs(popup)
</script>

<template>
  <BuyMPopupMain id="apiPromiseSystem">
    <CommonMLoadingContainer>
      <p class="text-center" v-html="apiPromiseData.content" />
    </CommonMLoadingContainer>
  </BuyMPopupMain>
</template>

<style></style>
