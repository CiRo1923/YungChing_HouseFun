<script setup>
import { usePopupStore } from '@stores/popup.js'

import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const popup = usePopupStore()
const { confirmData, confirmCheck } = storeToRefs(popup)
const { onConfirmClose } = useBuyPopupActions()

const confirm = computed(() => confirmData.value || {})

const onClose = (item) => {
  const { type } = item
  const isSure = type === 'sure'

  confirmCheck.value(isSure)
  onConfirmClose()
}
</script>

<template>
  <BuyMPopup
    id="confirmSystem"
    :setClass="{
      main: 'p:--w-800 t:--w-600',
    }"
  >
    <div class="text-center text-[16px]" v-html="confirm.content" />
    <template #footer>
      <div class="text-center">
        <ul class="inline-flex items-center m:gap-x-[8px] pt:gap-x-[12px]">
          <li
            class="min-w-[100px]"
            v-for="(item, index) in confirm.btns"
            :key="`confirm_${item.label}_${index}`"
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
