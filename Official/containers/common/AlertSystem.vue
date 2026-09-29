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
    <div :class="setClass.body || popup.defaultSetClass.content" v-html="alert.content" />
    <template #footer>
      <div class="text-center">
        <ul
          class="m:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
        >
          <li
            class="m:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]"
            v-for="(item, index) in alert.btns"
            :key="`alert_${item.label}_${index}`"
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
