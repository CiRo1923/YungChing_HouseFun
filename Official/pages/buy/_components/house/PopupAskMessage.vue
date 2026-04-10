<script setup>
import { usePopupStore } from '@stores/popup.js'
import useBuyPopupActions from '@stores/buy/_composables/usePopupActions.js'

const popup = usePopupStore()
const { customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()

const onSure = async () => {
  // const { valid } = await validate()

  // if (!valid) return

  // 驗證通過才真正 resolve + close
  customCheck.value(true)
  onCustomClose()
}
</script>

<template>
  <CustomPopup
    id="askMessage"
    :setClass="{
      main: 'p:--w-615',
    }"
    @sure="onSure"
  >
    留言
  </CustomPopup>
</template>

<style></style>
