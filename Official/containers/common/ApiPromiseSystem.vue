<script setup>
const popup = usePopupStore()
const { apiPromiseData } = storeToRefs(popup)
</script>

<template>
  <CommonMPopupMain
    id="apiPromiseSystem"
    :setClass="{
      main: 'p:--py-40 tm:--py-24 p:--px-60 tm:--px-30',
    }"
  >
    <CommonMLoadingContainer>
      <p class="text-center" v-html="apiPromiseData.content" />
    </CommonMLoadingContainer>
  </CommonMPopupMain>
</template>
