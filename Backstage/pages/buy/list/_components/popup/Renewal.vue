<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

import { Form } from 'vee-validate'

// const buyProject = useBuyProjectStore()
// const { selectItems } = storeToRefs(buyProject)
// const buyList = useBuyListStore()
// const { datas } = storeToRefs(buyList)
const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { selectCount, renewalCanNotPublishData, renewalNotExpiredData } = useBuyListActions()
const { onCustomClose } = useBuyPopupActions()
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
const hasNotPublish = computed(
  () => !customData.value.data && renewalCanNotPublishData.value.length !== 0
)
const hasExpired = computed(() =>
  customData.value.data
    ? customData.value.data._checked.publish && customData.value.data._checked.isExpired
    : renewalNotExpiredData.value.length === 0
)
const count = computed(() =>
  !customData.value.data
    ? selectCount.value - renewalCanNotPublishData.value.length - renewalNotExpiredData.value.length
    : hasExpired.value
      ? 1
      : 0
)

const onSure = async () => {
  if (formRef.value) {
    const validate = async () => await formRef.value?.validate?.()
    const { valid } = await validate()

    if (!valid) return
  }

  // 驗證通過才真正 resolve + close
  customCheck.value(true)
  onCustomClose()
}
</script>

<template>
  <CustomPopup
    id="popupRenewal"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
    @sure="onSure"
  >
    <PageBuyPublishInfo :data="publishInfo" v-if="customData.data" />

    <ul class="popup-renewal-contaiiner" :class="{ 'tm:mt-[8px] p:mt-[16px]': publishInfo }">
      <li class="popup-renewal-item" v-if="count !== 0">
        <p class="text-[14px] text-[--gray-666]" v-if="!customData.data">
          已選擇 <span class="text-[--orange-e646]">{{ selectCount }}</span> 個物件，需要使用
          <span class="text-[--orange-e646]">{{ count }}</span>
          個刊登額度
        </p>
        <Form as="div" class="tm:mt-[8px] p:mt-[16px]" ref="formRef">
          <PageBuyRenewalInfo />
        </Form>
      </li>
      <li class="popup-renewal-item" v-if="!hasExpired">
        <template v-if="!customData.data">
          <p class="text-[14px] text-[--gray-666]">
            已選擇
            <span class="text-[--orange-e646]">{{ selectCount }}</span> 個物件，無需使用刊登額度為
            <span class="text-[--orange-e646]">{{ renewalNotExpiredData.length }}</span> 個物件
          </p>
          <ul class="divide-y-[1px] divide-[--gray-e5] tm:mt-[8px] p:mt-[16px]">
            <li
              class="tm:py-[8px] p:py-[12px]"
              v-for="(item, index) in renewalNotExpiredData"
              :key="`${item.hfID}_${index}`"
            >
              <PageBuyListPopupRenewalItem
                :data="item"
                :setClass="{
                  main: 'text-[--gray-666]',
                }"
              />
            </li>
          </ul>
        </template>
        <p class="text-center tracking-wider text-[--gray-666]" v-else>
          物件仍在刊登效期內，無需使用刊登額度
        </p>
      </li>
      <li class="popup-renewal-item" v-if="hasNotPublish">
        <p class="text-[14px] text-[--gray-666]">
          已選擇
          <span class="text-[--orange-e646]">{{ selectCount }}</span> 個物件，不符合刊登條件為
          <span class="text-[--orange-e646]">{{ renewalCanNotPublishData.length }}</span> 個物件
        </p>
        <ul class="divide-y-[1px] divide-[--gray-e5] tm:mt-[8px] p:mt-[16px]">
          <li
            class="tm:py-[8px] p:py-[12px]"
            v-for="(item, index) in renewalCanNotPublishData"
            :key="`${item.hfID}_${index}`"
          >
            <PageBuyListPopupRenewalItem
              :data="item"
              :setClass="{
                main: 'text-[--gray-ccce]',
              }"
            />
          </li>
        </ul>
      </li>
    </ul>
  </CustomPopup>
</template>

<style lang="postcss">
.popup-renewal-item {
  &:not(:last-child) {
    @apply border-b border-dashed border-[--gray-e5];
  }
}

@screen p {
  .popup-renewal-item {
    &:not(:first-child) {
      @apply pt-[16px];
    }

    &:not(:last-child) {
      @apply pb-[16px];
    }
  }
}
</style>
