<script setup>
import { Form } from 'vee-validate'

const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const { onCustomClose } = usePopupActions()
const formRef = ref(null)
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddr: 'address',
    buName: 'community',
    casePrice: 'price',
    picURLCover: 'cover',
  }

  return customData.value.data
    ? Object.fromEntries(
        Object.entries(customData.value.data)
          .filter(([key]) => keyMap[key])
          .map(([key, value]) => [keyMap[key], value])
      )
    : null
})

const onSure = async () => {
  const validate = async () => await formRef.value?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才關閉,關閉時一併結算(resolver 由 onSettle 收掉)
  onCustomClose(true)
}
</script>

<template>
  <BuyCommonCustomPopup
    id="popupGolden"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
    @sure="onSure"
  >
    <PageBuyPublishInfo :data="publishInfo" v-if="publishInfo" />
    <Form as="div" class="tm:mt-[16px] p:mt-[24px]" ref="formRef">
      <PageBuyGoldenInfo />
    </Form>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
