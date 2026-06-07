<script setup>
import { numberComma } from '@js/_prototype.js'
import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { autoRefresh } = storeToRefs(buyProject)
const popup = usePopupStore()
const { customCheck } = storeToRefs(popup)
const { onCustomClose } = useBuyPopupActions()

const formRef = ref(null)
const info = computed(() => autoRefresh.value.info || null)
const listPlans = computed(() => autoRefresh.value.availablePlans)
const selectedIndex = computed(() => autoRefresh.value.templateSave.selectedIndex)
const template = computed(() => autoRefresh.value.templateSave.list || [])
const refreshCount = computed(() => template.value[selectedIndex.value]?.refreshCount ?? 0)
const count = computed(() => refreshCount.value - info.value.currentCount)

const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddr: 'address',
    buName: 'community',
    casePrice: 'price',
    picURLCover: 'cover',
  }

  return info.value
    ? Object.fromEntries(
        Object.entries(info.value)
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
    id="popupAutoRefreshTemplateRenewal"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
    @sure="onSure"
  >
    <PageBuyPublishInfo :data="publishInfo" v-if="publishInfo" />
    <div class="tm:mt-[16px] p:mt-[24px]">
      <PageBuyPublishLabelText
        label="請選擇額度"
        icon="icon_quota"
        :setClass="{
          icon: 'text-[--gray-666]',
        }"
      />
      <p
        class="shrink-0 text-center tracking-wider text-[--gray-666] tm:mt-[8px] tm:text-[14px] p:mt-[16px] p:text-[16px]"
      >
        已設定
        <b class="font-semibold text-[--orange-e646]">{{ refreshCount }}</b>
        個時間<br class="pt:hidden" /><small class="m:hidden">，</small>需要使用
        <b class="font-semibold text-[--orange-e646]">{{ count }}</b>
        個自動刷新額度
      </p>
      <Form as="div" class="mx-auto tm:mt-[16px] p:mt-[24px] p:max-w-[800px]" ref="formRef">
        <BuyMFormHidden
          name="planID"
          v-model="autoRefresh.templateSave.apiData.planID"
          :rules="{
            required: '請選擇額度',
          }"
          :setClass="{
            error: 'mt-[15px] text-center',
          }"
          v-slot="{ isError }"
        >
          <ul class="m:space-y-[16px] pt:space-y-[8px]">
            <li
              v-for="(item, index) in listPlans"
              :key="`${item.planType}_${item.planID}_${index}`"
            >
              <BuyMFormRadioItem
                name="planID"
                v-model="autoRefresh.templateSave.apiData.planID"
                :config="{
                  value: item.planID,
                  isError: isError,
                  isDisabled: item.isDisabled,
                }"
                :setClass="{
                  main: 'p:--px-40 p:--py-16 tm:--p-16',
                  label: 'text-[16px] text-[--gray-666] pt:flex pt:items-center',
                }"
              >
                <p class="pt:grow">{{ item.planName }}</p>
                <div class="flex items-center p:gap-x-[30px]">
                  <p class="grow p:w-[135px]">
                    {{
                      item.isExchange ? `${item.expireDate} 到期` : `刊登期 ${item.durationDays} 天`
                    }}
                  </p>
                  <p class="shrink-0">
                    剩餘額度：<b class="font-semibold text-[--orange-e646]">
                      {{ numberComma.add(item.availableCount) }}
                    </b>
                  </p>
                </div>
              </BuyMFormRadioItem>
            </li>
          </ul>
        </BuyMFormHidden>
      </Form>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
