<script setup>
const popup = usePopupStore()
const { apiPromiseData } = storeToRefs(popup)
</script>

<template>
  <CommonMPopup id="apiPromiseSystem">
    <CommonMLoadingContainer>
      <p class="text-center" v-html="apiPromiseData.content" />
    </CommonMLoadingContainer>
  </CommonMPopup>
</template>
