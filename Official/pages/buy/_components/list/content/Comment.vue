<script setup>
const { onCustom } = useBuyPopupActions()

const onClick = async () => {
  const { isSure } = await onCustom({
    id: 'popupComment',
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

  console.log(isSure)
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
