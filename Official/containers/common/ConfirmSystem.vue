<script setup>
const popup = usePopupStore()
const { confirmData } = storeToRefs(popup)
const { onConfirmClose } = usePopupActions()
const confirm = computed(() => confirmData.value || {})
const setClass = computed(() => confirm.value.setClass || {})

const onClose = (item) => {
  onConfirmClose(item.type === 'sure', item)
}
</script>

<template>
  <CommonMPopup
    id="confirmSystem"
    :setClass="{
      ...popup.defaultSetClass.byType.confirm,
      main: [
        setClass.main || popup.defaultSetClass.messageWidth,
        popup.defaultSetClass.main,
        popup.defaultSetClass.byType.confirm.main,
      ],
    }"
  >
    <div
      :class="
        setClass.body ||
        popup.defaultSetClass.byType.confirm.content ||
        popup.defaultSetClass.content
      "
      v-html="confirm.content"
    />
    <template #footer>
      <div class="text-center">
        <ul :class="popup.defaultSetClass.buttonList">
          <li
            :class="popup.defaultSetClass.buttonItem"
            v-for="(item, index) in confirm.btns"
            :key="`confirm_${item.label}_${index}`"
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
