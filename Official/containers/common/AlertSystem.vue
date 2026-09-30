<script setup>
/* starter —— 這一支是起手樣板:複製一次,之後歸接手的專案所有。

  整套更新時**不要覆蓋它**。掛在版面上的這幾支容器決定這個站有哪幾種彈窗、
  各自的版面與預設 class,而那是每個站自己的事;它們與彈窗那支 store
  是一組(那邊有哪幾種,這邊就有對應的容器)。

  蓋過去等於把已經接好的那一套換成別人的 —— 不會報錯,
  要開啟那個彈窗才看得出來。 */

const popup = usePopupStore()
const { alertData } = storeToRefs(popup)
const { onAlertClose } = usePopupActions()
const alert = computed(() => alertData.value || {})
const setClass = computed(() => alert.value.setClass || {})

const onClose = (item) => {
  onAlertClose(item.type === 'sure', item)
}
</script>

<template>
  <CommonMPopup
    id="alertSystem"
    :setClass="{
      ...popup.defaultSetClass.byType.alert,
      main: [
        setClass.main || popup.defaultSetClass.messageWidth,
        popup.defaultSetClass.main,
        popup.defaultSetClass.byType.alert.main,
      ],
    }"
  >
    <div
      :class="
        setClass.body || popup.defaultSetClass.byType.alert.content || popup.defaultSetClass.content
      "
      v-html="alert.content"
    />
    <template #footer>
      <div class="text-center">
        <ul :class="popup.defaultSetClass.buttonList">
          <li
            :class="popup.defaultSetClass.buttonItem"
            v-for="(item, index) in alert.btns"
            :key="`alert_${item.label}_${index}`"
          >
            <CommonMAnchor
              :text="item.label"
              :config="{ isDisabled: item.isDisabled }"
              :setClass="{
                main: [item.class, popup.defaultSetClass.button],
                text: popup.defaultSetClass.buttonText,
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </CommonMPopup>
</template>
