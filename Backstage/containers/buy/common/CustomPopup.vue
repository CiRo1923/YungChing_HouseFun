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
    ? buyPopup.buttons.alert
    : isConfirmBtns.value
      ? buyPopup.buttons.confirm
      : customData.value.btns || null
})
const config = computed(() => {
  return {
    data: null,
    ...props.config,
  }
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
  customCheck.value(isSure ? config.value.data || true : false)

  if (isShouldClose) onCustomClose()
}
</script>

<template>
  <BuyMPopup :id="props.id" :setClass="props.setClass">
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
          <ul class="inline-flex items-center tm:gap-x-[8px] p:gap-x-[16px]">
            <li
              class="min-w-[100px]"
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
  </BuyMPopup>
</template>

<style></style>
