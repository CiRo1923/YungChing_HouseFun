<script setup>
import { Form } from 'vee-validate'

const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { searchSelectCount } = useBuyListActions()
const { onCustomClose } = useBuyPopupActions()
const formRef = ref(null)
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddr: 'address',
    buName: 'community',
    casePrice: 'price',
    picURLCover: 'cover',
    caseDealInfo: 'info',
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

  // 驗證通過才真正 resolve + close
  customCheck.value(true)
  onCustomClose()
}
</script>

<template>
  <BuyCommonCustomPopup
    id="popupDeal"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
    @sure="onSure"
  >
    <PageBuyPublishInfo :data="publishInfo" v-if="publishInfo" />
    <p class="text-[14px] text-[--gray-666]" v-else>
      已選擇
      <span class="text-[--orange-e646]">{{ searchSelectCount }}</span>
      個物件，物件成交後將無法重新上架
    </p>
    <Form as="div" class="tm:mt-[16px] p:mt-[24px]" ref="formRef">
      <PageBuyDealInfo :data="publishInfo" />
    </Form>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
