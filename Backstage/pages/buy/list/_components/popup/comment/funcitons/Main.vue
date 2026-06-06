<script setup>
const emits = defineEmits(['click:reply', 'click:noReply'])

const onClick = (id) => {
  emits(`click:${id}`)
}
</script>

<template>
  <div
    class="flex py-[16px] m:flex-wrap m:gap-y-[5px] m:border-y-[1px] m:border-y-[--gray-e5] t:pt-[12px] pt:items-center pt:border-t-[1px] pt:border-t-[--gray-e5] p:gap-x-[24px]"
  >
    <PageBuyListPopupCommentFuncitonsSelectAll />
    <PageBuyListPopupCommentFuncitonsEvents
      @click:reply="onClick('reply')"
      @click:noReply="onClick('noReply')"
    />
    <PageBuyListPopupCommentFuncitonsSelectCount />
  </div>
</template>

<style lang="postcss"></style>
