<script setup>
import { Form } from 'vee-validate'

const project = useBuyProjectStore()
const { autoRefresh } = storeToRefs(project)
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
    id="popupAutoRefreshTemplate"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
      body: 'flex flex-col',
    }"
    @sure="onSure"
  >
    <div class="pt:flex pt:grow pt:flex-col pt:overflow-hidden">
      <PageBuyPublishInfo
        :data="publishInfo"
        :setClass="{
          main: 'pt:shrink-0',
        }"
        v-if="publishInfo"
      />
      <Form
        as="div"
        class="tm:mt-[16px] pt:flex pt:grow pt:flex-col pt:overflow-hidden p:mt-[24px]"
        ref="formRef"
      >
        <BuyMFormHidden
          name="listSelectedtempalteID"
          v-model="autoRefresh.templateSave.apiData.templateID"
          :rules="{
            required: '請選擇範本',
          }"
          :setClass="{
            main: '',
            error: 'mt-[15px] text-center',
          }"
        >
          <PageBuyAutoRefreshTemplateInfo />
        </BuyMFormHidden>
      </Form>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
