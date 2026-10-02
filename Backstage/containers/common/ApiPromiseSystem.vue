<script setup>
/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。掛在版面上的這幾支容器決定這個站有哪幾種彈窗、
  各自的版面與預設 class,而那是每個站自己的事;它們與彈窗那支 store
  是一組(那邊有哪幾種,這邊就有對應的容器)。

  蓋過去等於把已經接好的那一套換成別人的 —— 不會報錯,
  要開啟那個彈窗才看得出來。 */

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
