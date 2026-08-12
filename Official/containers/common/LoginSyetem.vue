<script setup>
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const { onCustomClose, onCustomSettle } = usePopupActions()
const login = computed(() => customData.value || {})

const props = defineProps({
  container: {
    type: Object,
    default: null,
  },
})

const onClose = async (item) => {
  const isSure = item.type === 'sure'

  // 登入(sure 且不自動關):先驗證,通過才 resolve + close
  if (isSure && item.isClose === false) {
    const { valid } = (await props.container?.form?.validate?.()) ?? {}

    if (!valid) return

    onCustomClose(true, item)
    return
  }

  // 保持開啟但要回報結果
  if (item.isClose === false) {
    onCustomSettle(isSure, item)
    return
  }

  // 取消 / 允許直接關:關閉時一併結算
  onCustomClose(isSure, item)
}
</script>

<template>
  <CommonMPopupMain
    id="loginSystem"
    :config="{
      mode: {
        m: 'bottomSheet',
      },
    }"
    :setClass="{
      main: 'p:--w-500 t:--w-375 p:--py-40 tm:--py-24 p:--px-60 tm:--px-30',
    }"
  >
    <slot />
    <template #footer>
      <div class="text-center">
        <ul
          class="m:flex m:justify-center m:gap-[8px] t:gap-x-[8px] pt:inline-flex pt:items-center p:gap-x-[16px]"
        >
          <li
            class="m:max-w-[50%] m:flex-1 t:w-[150px] p:w-[200px]"
            v-for="(item, index) in login.btns"
            :key="`custom_${item.label}_${index}`"
          >
            <CommonMAnchor
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
    </template>
    <template #note v-if="$slots.note">
      <slot name="note" />
    </template>
  </CommonMPopupMain>
</template>

<style lang="postcss"></style>
