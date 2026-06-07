<script setup>
import { Form } from 'vee-validate'
const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()

const minSelectCount = 3
const listTimeSpan = computed(() => customData.value.data.listTImeSpan)
const selectedLength = computed(
  () => autoRefresh.value.templateSaveTime.apiData.listSelectedRefreshTime.length ?? 0
)
const notMinCount = computed(() => selectedLength.value < minSelectCount)

const formRef = ref(null)
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
    id="popupAutoRefreshTemplateEditTime"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
      body: 'flex flex-col',
    }"
    @sure="onSure"
  >
    <Form as="div" class="tm:space-y-[16px] p:space-y-[30px]" ref="formRef">
      <div class="m:space-y-[16px] pt:flex pt:gap-x-[16px]">
        <BuyMFormLabel
          label="設定名稱"
          :setClass="{
            main: 'pt:shrink-0 p:flex p:h-[40px] p:items-center',
          }"
        />
        <BuyMFormInput
          name="templateName"
          v-model="autoRefresh.templateSaveTime.apiData.templateName"
          :config="{
            placeholder: '自定義範本名稱',
            maxlength: 10,
            formatLength: '{length} / {maxlength}',
          }"
          :rules="{
            required: '請輸入自定義範本名稱',
          }"
          :setClass="{
            main: '--h-40 --px-12 --py-8 pt:grow',
            element: 'grow',
            length: 'text-[14px] text-[--gray-999]',
            suffix: 'block text-[14px] text-[--gray-999] tm:mt-[8px] p:mt-[4px]',
          }"
        />
      </div>
      <PageBuyPopupAutoRefreshTemplateTimeNote
        :minSelectCount="minSelectCount"
        :count="selectedLength"
      />
      <BuyMFormHidden
        name="listSelectedRefreshTime"
        v-model="notMinCount"
        :rules="{
          custom: {
            valid: !notMinCount,
            errorMessage: `請至少設定 ${minSelectCount} 次時間`,
          },
        }"
        :setClass="{
          main: 'overflow-hidden m:flex m:grow m:flex-col',
          error: 'mt-[15px] text-center',
        }"
      >
        <div class="scrollbar --y m:grow">
          <ul
            class="flex flex-wrap items-center gap-y-[16px] m:gap-x-[8px] t:gap-x-[10px] p:gap-x-[20px]"
          >
            <li
              v-for="(item, index) in listTimeSpan"
              :key="`${item.timeID}_${item.timeDescription}_${index}`"
            >
              <BuyMTimeMain
                name="listSelectedRefreshTime"
                :text="item.timeDescription"
                v-model="autoRefresh.templateSaveTime.apiData.listSelectedRefreshTime"
                :config="{
                  as: 'label',
                  value: item.timeID,
                  isLock: item.isLocked,
                }"
                :setClass="{
                  main: '--h-30 p:--w-85 tm:--w-80',
                  text: 'text-[14px]',
                }"
              />
            </li>
          </ul>
        </div>
      </BuyMFormHidden>
    </Form>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
