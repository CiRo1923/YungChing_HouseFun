<script setup>
import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { apiMessageData, messageData, cottonCandyCheckbox } = storeToRefs(buyProject)
const { onApiMessages } = useBuyProjectActions()
const popup = usePopupStore()
const { customCheck } = storeToRefs(popup)
const { onCustom, onCustomClose } = useBuyPopupActions()
const { onPromise } = usePopupActions()

const formRef = ref(null)
const cottonCandy = computed(() => messageData.value?.cottonCandy?.items ?? [])
const isMember = computed(() => messageData.value?.isMember ?? false)
const model = computed(() =>
  cottonCandyCheckbox.value?.length === 0 ? null : cottonCandyCheckbox.value.join(',')
)

const onCheck = (id) => {
  return cottonCandyCheckbox.value.findIndex((item) => item === id) !== -1
}

const onSure = async () => {
  const validate = async () => await formRef.value?.validate?.()
  const { valid } = await validate()

  if (!valid) return

  // 驗證通過才真正 resolve + close

  onPromise('open')
  for (let i = 0; i < cottonCandyCheckbox.value.length; i += 1) {
    apiMessageData.value.houseId = cottonCandyCheckbox.value[i]

    await onApiMessages()
  }
  onPromise('close')

  customCheck.value(true)
  onCustomClose()

  await onCustom({
    id: 'popupCottonCandySuccess',
    title: '已完成額外預約留言',
    btns: isMember.value
      ? 'alert'
      : [
          {
            id: 'cancel',
            label: '關閉',
            class: '--border-gray-e5 --text-gray-666',
            type: 'cancel',
            isClose: true,
          },
          {
            id: 'sure',
            label: '立即註冊',
            class: '--bg-orange-f74c --text-white',
            type: 'sure',
            isClose: true,
          },
        ],
  })
}
</script>

<template>
  <BuyCommonCustomPopup
    id="popupCottonCandy"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-1200',
    }"
    @sure="onSure"
  >
    <p class="mb-[8px] text-[18px]">我們發現這些好房也很適合你，趁現在一起預約 !</p>
    <Form as="div" ref="formRef">
      <BuyMFormHidden
        v-model="model"
        :rules="{
          required: '請選擇適合你的好房',
        }"
        :setClass="{
          error: 'mt-[15px] text-center',
        }"
        v-slot="{ isError }"
      >
        <BuyMSwiperHorizontal
          name="cottonCandy"
          :data="cottonCandy"
          :config="{
            nav: false,
            slidesPerView: {
              p: 4,
              t: 2.7,
              m: 1.2,
            },
          }"
          :setClass="{
            main: 'h-full',
            container: 'pt:[--m-swiper-gap:4px]',
          }"
          v-slot="{ item }"
        >
          <div
            class="space-y-[8px] rounded-[10px] px-[8px] py-[10px] transition-colors duration-300"
            :class="{ 'bg-[--green-9c33]': onCheck(item.id) }"
          >
            <BuyMFormCheckBox
              name="cottonCandyCheckbox"
              v-model="cottonCandyCheckbox"
              :config="{
                value: item.id,
                isError: isError,
              }"
              :setClass="{
                main: 'p:--icon-size-25 tm:--icon-size-20 --checkbox-white',
                icon: 'p-[4px]',
              }"
            />
            <PageBuyCommonCard
              :item="item"
              :config="{
                target: '_blank',
              }"
              :setClass="{
                container: 'rounded-[10px]',
              }"
            />
          </div>
        </BuyMSwiperHorizontal>
      </BuyMFormHidden>
    </Form>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
