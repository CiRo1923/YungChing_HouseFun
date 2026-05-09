<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'

import PublishInfo from '@pages/buy/_components/PublishInfo.vue'
import AvailablePlans from '@pages/buy/_components/AvailablePlans.vue'

import { usePopupStore } from '@stores/popup.js'
import useBuyListActions from '@stores/buy/composables/useListActions.js'
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

import { Form } from 'vee-validate'

const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { selectCount } = useBuyListActions()
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
  <CustomPopup
    id="popupPlans"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
    @sure="onSure"
  >
    <PublishInfo :data="publishInfo" v-if="publishInfo" />
    <p class="text-[14px] text-[--gray-666]" v-else>
      已選擇 <span class="text-[--orange-e646]">{{ selectCount }}</span> 個物件，需要使用
      <span class="text-[--orange-e646]">{{ selectCount }}</span> 個刊登額度
    </p>
    <Form as="div" class="p:mt-[24px]" ref="formRef">
      <AvailablePlans />
    </Form>
  </CustomPopup>
</template>

<style lang="postcss"></style>
