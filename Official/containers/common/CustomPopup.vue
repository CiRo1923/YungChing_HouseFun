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
  <!--
    傳送目標由彈窗那支 store 決定(teleportTarget)—— 各專案掛的容器
    名字與位置都可能不一樣。這個框架自己會渲染一個在應用程式根節點之後,
    不必在版型裡自己放;自己放的那種要先確認它真的存在。
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
    <Teleport :to="popup.teleportTarget">
      <CommonMPopup
        :id="props.id"
        :config="props.config"
        :setClass="{
          ...popup.defaultSetClass.byType.custom,
          ...props.setClass,
          main: [
            popup.defaultSetClass.main,
            popup.defaultSetClass.byType.custom.main,
            props.setClass.main,
          ],
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
            :class="popup.defaultSetClass.byType.custom.content || popup.defaultSetClass.content"
            v-html="custom.content"
          />
        </slot>
        <template #footer v-if="$slots.footer || footerBtns">
          <slot name="footer">
            <div class="text-center">
              <ul :class="popup.defaultSetClass.buttonList">
                <li
                  :class="popup.defaultSetClass.buttonItem"
                  v-for="(item, index) in footerBtns"
                  :key="`custom_${item.label}_${index}`"
                >
                  <CommonMAnchor
                    :text="item.label"
                    :config="{ isDisabled: item.isDisabled }"
                    :setClass="{
                      main: [item.class, popup.defaultSetClass.button],
                      text: popup.defaultSetClass.buttonText,
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
