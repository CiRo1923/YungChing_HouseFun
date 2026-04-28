<script setup>
import { usePopupStore } from '@stores/popup.js'
import { useBuyPopupStore } from '@stores/buy/popup.js'

import useBuyPopupActions from '@stores/buy/_composables/usePopupActions.js'

const popup = usePopupStore()
const { customCheck, customData } = storeToRefs(popup)
const buyPopup = useBuyPopupStore()
const { onCustomClose } = useBuyPopupActions()
const emits = defineEmits(['sure'])
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
const custom = computed(() => customData.value || {})
const isAlertBtns = computed(() => !!(customData.value.btns === 'alert'))
const isConfirmBtns = computed(() => !!(customData.value.btns === 'confirm'))

const footerBtns = computed(() => {
  return isAlertBtns.value
    ? buyPopup.buttons.alert
    : isConfirmBtns.value
      ? buyPopup.buttons.confirm
      : customData.value.btns || null
})

const onClose = (item) => {
  const isSure = item.type === 'sure'

  // sure 不允許自動 close：不要 resolve Promise，改用事件通知外面驗證
  if (isSure && item.isClose === false) {
    emits('sure')
    return
  }

  // cancel 或允許 sureClose 的情況：照舊 resolve + close
  const isShouldClose = item.isClose !== false
  customCheck.value(isSure)

  if (isShouldClose) onCustomClose()
}
</script>

<template>
  <BuyMPopup :id="props.id" :setClass="props.setClass">
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>
    <slot>
      <div class="text-[16px]" v-html="custom.content" />
    </slot>
    <template #footer v-if="$slots.footer || footerBtns">
      <slot name="footer">
        <div class="text-center">
          <ul class="inline-flex items-center p:gap-x-[16px]">
            <li
              class="min-w-[100px]"
              v-for="(item, index) in footerBtns"
              :key="`custom_${item.label}_${index}`"
            >
              <BuyMAnchor
                :text="item.label"
                :setClass="{
                  main: [item.class, '--oval --h-45 w-full'],
                  text: 'font-normal',
                }"
                @click="onClose(item)"
              />
            </li>
          </ul>
        </div>
      </slot>
    </template>
  </BuyMPopup>
</template>

<style></style>
