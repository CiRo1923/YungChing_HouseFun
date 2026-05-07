<script setup>
import useBuyPopupActions from '@stores/buy/composables/usePopupActions.js'

const { onCustom } = useBuyPopupActions()
const props = defineProps({
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const setClass = computed(() => {
  return {
    main: '',
    ...props.setClass,
  }
})

const onPopupFeature = async () => {
  const isCustom = await onCustom({
    id: 'popupFeature',
    title: '參考描述範例',
    icon: 'icon_edit',
    btns: 'alert',
  })

  if (isCustom) {
    console.log('ok')
  }
}
</script>

<template>
  <div
    class="text-[14px] text-[--gray-666] m:space-y-[8px] m:text-center pt:inline-flex pt:items-center p:gap-x-[16px]"
    :class="setClass.main"
  >
    <p>請遵守著作權規範，勿使用他人特色描述</p>
    <BuyMAnchor
      text="參考描述範例"
      :config="{
        icon: {
          position: 'left',
          name: 'icon_smile',
        },
      }"
      :setClass="{
        main: '--text-green-6a2d underline',
        text: 'font-normal',
        icon: 'h-[18px] w-[18px] text-[--gray-666]',
      }"
      @click="onPopupFeature"
    />
  </div>
</template>

<style></style>
