<script setup>
import { Form } from 'vee-validate'

const project = useBuyProjectStore()
const { autoRefresh } = storeToRefs(project)
const popup = usePopupStore()
const { customData, customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()

const formRef = ref(null)
const maxSelectTime = computed(() => customData.value.data.maxSelectTime)
const listTimeSpan = computed(() => customData.value.data.listTimeSpan)
const selectedLength = computed(
  () => autoRefresh.value.save.apiData.listSelectedRefreshTime.length ?? 0
)
const notSameCount = computed(() => maxSelectTime.value !== selectedLength.value)

const onTimeDisabled = (item) => {
  const { timeID } = item
  const hasSelected = autoRefresh.value.save.apiData.listSelectedRefreshTime.find(
    (item) => item === timeID
  )

  return !hasSelected && maxSelectTime.value === selectedLength.value
}

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
    id="popupAutoRefreshEditTime"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
      body: 'flex flex-col',
    }"
    @sure="onSure"
  >
    <div class="space-y-[8px] tm:mb-[16px] p:mb-[32px]">
      <p class="shrink-0 text-[16px] font-semibold tracking-wider text-[--gray-333]">
        已設定
        <span class="text-[--orange-e646]">{{ selectedLength }}</span>
        個時間，需設定
        <span class="text-[--orange-e646]">{{ maxSelectTime }}</span>
        個自動刷新時段
      </p>
      <PageBuyPopupAutoRefreshTimeNote />
    </div>

    <Form as="div" class="overflow-hidden m:flex m:grow m:flex-col" ref="formRef">
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
              v-model="autoRefresh.save.apiData.listSelectedRefreshTime"
              :config="{
                as: 'label',
                value: item.timeID,
                isLock: item.isLocked,
                isDisabled: onTimeDisabled(item),
              }"
              :setClass="{
                main: '--h-30 p:--w-85 tm:--w-80',
                text: 'text-[14px]',
              }"
            />
          </li>
        </ul>
      </div>
      <BuyMFormHidden
        name="listSelectedRefreshTime"
        v-model="notSameCount"
        :rules="{
          custom: {
            valid: !notSameCount,
            errorMessage: `請設定 ${maxSelectTime} 個自動刷新時段`,
          },
        }"
        :setClass="{
          main: 'text-center',
          error: 'mt-[15px]',
        }"
      />
    </Form>

    <!-- <pre>
      {{ customData.data }}
    </pre> -->
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
