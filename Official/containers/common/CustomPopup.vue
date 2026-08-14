<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const buyPopup = useBuyPopupStore()
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
    ? buyPopup.buttons.alert
    : isConfirmBtns.value
      ? buyPopup.buttons.confirm
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
  <!--
    用 ClientOnly 包 Teleport:popup 純由互動驅動、不需 SSR。
    Nuxt SSR 下多個 Teleport 指向同一 #box,hydration 後 teleport 內部錨點可能損壞,
    更新時丟出 "Cannot read properties of null (reading 'insertBefore')"。
    ClientOnly 讓 teleport 只在 client 端全新掛載,錨點乾淨。
  -->
  <ClientOnly>
    <Teleport to="#box">
      <CommonMPopupMain
        :id="props.id"
        :config="props.config"
        :setClass="{
          ...props.setClass,
          ...{
            main: ['p:--py-40 tm:--py-24 p:--px-60 tm:--px-30', props.setClass.main],
          },
        }"
      >
        <template #header v-if="$slots.header">
          <slot name="header" />
        </template>
        <slot>
          <div
            class="text-center leading-[1.7] m:text-[14px] pt:text-[20px]"
            v-html="custom.content"
          />
        </slot>
        <template #footer v-if="$slots.footer || footerBtns">
          <slot name="footer">
            <div class="text-center">
              <ul
                class="m:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
              >
                <li
                  class="m:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]"
                  v-for="(item, index) in footerBtns"
                  :key="`custom_${item.label}_${index}`"
                >
                  <CommonMAnchor
                    :text="item.label"
                    :setClass="{
                      main: [item.class, '--oval --h-45 --text-center w-full'],
                      text: 'font-normal',
                    }"
                    @click="onClose(item)"
                  />
                </li>
              </ul>
            </div>
          </slot>
        </template>
        <template #note v-if="$slots.note">
          <slot name="note" />
        </template>
      </CommonMPopupMain>
    </Teleport>
  </ClientOnly>
</template>

<style></style>
