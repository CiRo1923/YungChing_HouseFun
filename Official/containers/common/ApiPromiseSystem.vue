<script setup>
const popup = usePopupStore()
const { apiPromiseData } = storeToRefs(popup)
</script>

<template>
  <CommonMPopup
    id="apiPromiseSystem"
    :setClass="{
      ...popup.defaultSetClass.byType.apiPromise,
      main: [popup.defaultSetClass.main, popup.defaultSetClass.byType.apiPromise.main],
    }"
  >
    <CommonMLoadingContainer>
      <p class="text-center" v-html="apiPromiseData.content" />
    </CommonMLoadingContainer>
  </CommonMPopup>
</template>
