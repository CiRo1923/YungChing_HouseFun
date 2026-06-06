<script setup>
const { commentsSelectCount } = useBuyListActions()

const emits = defineEmits(['click:reply', 'click:noReply'])
const datas = readonly([
  {
    id: 'reply',
    label: '已回覆',
  },
  {
    id: 'noReply',
    label: '未回覆',
  },
])

const onClick = (id) => {
  emits(`click:${id}`)
}
</script>

<template>
  <ul class="flex items-center m:order-3 tm:gap-x-[4px] p:gap-x-[8px]">
    <li v-for="(item, index) in datas" :key="`${item.id}_${index}`">
      <BuyMAnchor
        :text="item.label"
        :config="{
          isDisabled: commentsSelectCount === 0,
        }"
        :setClass="{
          main: '--border-gray-e5 --bg-white --oval --h-30 --px-15 --text-gray-666',
          text: 'text-[14px]',
        }"
        @click="onClick(item.id)"
      />
    </li>
  </ul>
</template>

<style lang="postcss"></style>
