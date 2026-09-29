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
    <div :class="setClass.body || popup.defaultSetClass.content" v-html="confirm.content" />
    <template #footer>
      <div class="text-center">
        <ul
          class="m:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
        >
          <li
            class="m:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]"
            v-for="(item, index) in confirm.btns"
            :key="`confirm_${item.label}_${index}`"
          >
            <CommonMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, popup.defaultSetClass.button],
                text: 'font-normal',
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </CommonMPopup>
</template>
