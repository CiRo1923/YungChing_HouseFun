<script setup>
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
  <BuyCustomPopup
    id="askMessage"
    :setClass="{
      main: 'p:--w-615',
    }"
    @sure="onSure"
  >
    留言
  </BuyCustomPopup>
</template>

<style></style>
