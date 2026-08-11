<script setup>
const buyProject = useBuyProjectStore()
const { message } = storeToRefs(buyProject)
const { reset } = useBuyProjectActions()
const { onCustom } = usePopupActions()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const onClick = async () => {
  reset.onMessage()
  message.value.apiData.houseId = props.item.hfid

  await onCustom({
    id: 'popupMessage',
    title: '詢問與留言',
    btns: [
      {
        label: '預約留言',
        type: 'sure',
        isClose: false,
      },
    ],
  })
}
</script>

<template>
  <div class="relative z-[1] shrink-0 m:self-end">
    <CommonMAnchor
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
