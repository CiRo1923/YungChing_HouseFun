<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const { onMergeBtns, onCustomClose, onCustomSettle } = usePopupActions()
const emits = defineEmits(['sure'])
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
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
    ? popup.buttons.alert
    : isConfirmBtns.value
      ? popup.buttons.confirm
      : onMergeBtns(customData.value.btns)
})

const onClose = (item) => {
  const isSure = item.type === 'sure'

  // sure 不允許自動 close：不要 resolve Promise，改用事件通知外面驗證
  if (isSure && item.isClose === false) {
    emits('sure')
    return
  }

  // 保持開啟但要回報結果
  if (item.isClose === false) {
    onCustomSettle(isSure, item)
    return
  }

  // cancel 或允許 sureClose 的情況：關閉時一併結算
  onCustomClose(isSure, item)
}
</script>

<template>
  <CommonMPopupMain :id="props.id" :config="props.config" :setClass="props.setClass">
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
  </CommonMPopupMain>
</template>

<style></style>
