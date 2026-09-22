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
    傳送目標是框架自己渲染的那個容器(#teleports,位置在應用程式根節點之後)——
    不必在版型裡自己放一個。自己放的那種要先確認它真的存在:
    目標找不到時 Teleport 不會報錯,彈窗就是不出現。

    用 ClientOnly 包起來:popup 純由互動驅動、不需 SSR。
    多個 Teleport 指向同一個容器時,hydration 後內部的錨點可能損壞,
    更新時丟出 "Cannot read properties of null (reading 'insertBefore')"。
    ClientOnly 讓 teleport 只在 client 端全新掛載,錨點乾淨。
  -->
  <ClientOnly>
    <Teleport to="#teleports">
      <CommonMPopup :id="props.id" :config="props.config" :setClass="props.setClass">
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
        <template #note v-if="$slots.note">
          <slot name="note" />
        </template>
      </CommonMPopup>
    </Teleport>
  </ClientOnly>
</template>
