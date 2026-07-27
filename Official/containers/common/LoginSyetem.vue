<script setup>
const popup = usePopupStore()
const { customCheck, customData } = storeToRefs(popup)
const { onCustomClose } = usePopupActions()
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

    customCheck.value(true, item)
    onCustomClose()
    return
  }

  // 取消 / 允許直接關:照舊 resolve + close
  customCheck.value(isSure, item)

  if (item.isClose !== false) onCustomClose()
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
      main: 'p:--w-500 t:--w-375',
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
