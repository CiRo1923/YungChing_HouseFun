<script setup>
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
  customCheck.value(isSure, item)

  if (isShouldClose) onCustomClose()
}
</script>

<template>
  <BuyMPopupMain :id="props.id" :setClass="props.setClass">
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>
    <template #headerTools v-if="$slots.headerTools">
      <slot name="headerTools" />
    </template>
    <slot>
      <div class="text-[16px]" :class="custom.setClass?.content" v-html="custom.content" />
    </slot>
    <template #footer v-if="$slots.footer || footerBtns">
      <slot name="footer">
        <div class="text-center">
          <ul
            class="m:grid m:grid-cols-2 m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
          >
            <li
              class="pt:min-w-[100px]"
              :class="{
                'm:col-span-2': footerBtns.length % 2 === 1 && index === footerBtns.length - 1,
              }"
              v-for="(item, index) in footerBtns"
              :key="`custom_${item.label}_${index}`"
            >
              <BuyMAnchor
                :text="item.label"
                :setClass="{
                  main: [item.class, '--oval --h-45 --px-20 w-full'],
                }"
                @click="onClose(item)"
              />
            </li>
          </ul>
        </div>
      </slot>
    </template>
  </BuyMPopupMain>
</template>

<style></style>
