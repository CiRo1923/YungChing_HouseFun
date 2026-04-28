<script setup>
import { usePopupStore } from '@stores/popup.js'
// import { useBuyPopupStore } from '@stores/buy/popup.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const popup = usePopupStore()
const { alertData, alertCheck } = storeToRefs(popup)
// const buyPopup = useBuyPopupStore()
const { onAlertClose } = useBuyPopupActions()
const alert = computed(() => alertData.value || {})

const onClose = (item) => {
  const { type } = item
  const isSure = type === 'sure'

  alertCheck.value(isSure)
  onAlertClose()
}
</script>

<template>
  <BuyMPopup
    id="alertSystem"
    :setClass="{
      main: 'p:--w-655 t:--w-490',
    }"
  >
    <div class="text-center text-[16px]" v-html="alert.content" />
    <template #footer>
      <div class="text-center">
        <ul class="inline-flex items-center m:gap-x-[8px] pt:gap-x-[12px]">
          <li
            class="min-w-[100px]"
            v-for="(item, index) in alert.btns"
            :key="`alert_${item.label}_${index}`"
          >
            <BuyMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, '--oval --h-45 w-full'],
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </div>
    </template>
  </BuyMPopup>
</template>

<style></style>
