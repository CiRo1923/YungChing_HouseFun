<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
// buttons 直接從 store 取:它是 readonly 常數,既不是 ref 也不是 reactive,
// storeToRefs 不會為它建立 ref —— 解構出來會是 undefined。
const { buttons } = popup
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
    ? buttons.alert
    : isConfirmBtns.value
      ? buttons.confirm
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
    傳送目標是框架自己渲染的那個容器(#teleports,位置在應用程式根節點之後)——
    不必在版型裡自己放一個。自己放的那種要先確認它真的存在:
    目標找不到時 Teleport 不會報錯,彈窗就是不出現。

    用 ClientOnly 包起來:popup 純由互動驅動、不需 SSR。
    多個 Teleport 指向同一個容器時,hydration 後內部的錨點可能損壞,
    更新時丟出 "Cannot read properties of null (reading 'insertBefore')"。
    ClientOnly 讓 teleport 只在 client 端全新掛載,錨點乾淨。

    改用框架自己的容器之後這一層還需不需要,要實際測過才知道 ——
    沒測之前先留著:拿掉之後那個錯誤只在特定的開關順序下才出現,
    平常點不出來,而它一出現就是整個彈窗系統壞掉。
  -->
  <ClientOnly>
    <Teleport to="#teleports">
      <CommonMPopup
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
        <template #headerTools v-if="$slots.headerTools">
          <slot name="headerTools" />
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
      </CommonMPopup>
    </Teleport>
  </ClientOnly>
</template>
