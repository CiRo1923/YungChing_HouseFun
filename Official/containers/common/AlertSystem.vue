<script setup>
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
