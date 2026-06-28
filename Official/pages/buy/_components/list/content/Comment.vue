<script setup>
const buyProject = useBuyProjectStore()
const { apiMessageData } = storeToRefs(buyProject)
const { onResetMessage } = useBuyProjectActions()
const { onCustom } = useBuyPopupActions()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const onClick = async () => {
  onResetMessage()
  apiMessageData.value.houseId = props.item.hfid

  await onCustom({
    id: 'popupMessage',
    title: '詢問與留言',
    btns: [
      {
        id: 'sure',
        label: '預約留言',
        type: 'sure',
        class: '--bg-orange-f74c --text-white',
        isClose: false,
      },
    ],
  })
}
</script>

<template>
  <div class="relative z-[1] shrink-0 m:self-end">
    <BuyMAnchor
      text="預約留言"
      :config="{
        icon: {
          name: 'icon_dialogue',
          position: 'left',
        },
      }"
      :setClass="{
        main: '--border-orange-f74c --text-orange-e646 --h-25 --oval --px-10 gap-x-[3px]',
        text: 'text-[14px]',
        icon: 'h-[16px] w-[16px] p-[1px]',
      }"
      @click="onClick"
    />
  </div>
</template>

<style lang="postcss"></style>
