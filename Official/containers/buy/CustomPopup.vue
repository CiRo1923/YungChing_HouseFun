<script setup>
import { useBuyPopupStore } from '@stores/buy/popup.js'

const popup = useBuyPopupStore()
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
const custom = computed(() => popup.customData || {})
const isAlertBtns = computed(() => !!(popup.customData.btns === 'alert'))
const isConfirmBtns = computed(() => !!(popup.customData.btns === 'confirm'))

const footerBtns = computed(() => {
  return isAlertBtns.value
    ? popup.buttons.alert
    : isConfirmBtns.value
      ? popup.buttons.confirm
      : popup.customData.btns || null
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
  custom.value.check(isSure)

  if (isShouldClose) custom.value.close()
}
</script>

<template>
  <BuyMPopup :id="props.id" :setClass="props.setClass">
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>
    <slot>
      <div class="text-center leading-[1.7] m:text-[14px] pt:text-[20px]" v-html="custom.content" />
    </slot>
    <template #footer v-if="$slots.footer || footerBtns">
      <slot name="footer">
        <ul class="flex items-center">
          <li
            class="flex-1"
            v-for="(item, index) in footerBtns"
            :key="`custom_${item.label}_${index}`"
          >
            <BuyMAnchor
              :text="item.label"
              :setClass="{
                main: [item.class, 'w-full'],
              }"
              @click="onClose(item)"
            />
          </li>
        </ul>
      </slot>
    </template>
  </BuyMPopup>
</template>

<style></style>
