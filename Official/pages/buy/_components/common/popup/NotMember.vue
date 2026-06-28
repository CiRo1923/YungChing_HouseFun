<script setup>
const buyProject = useBuyProjectStore()
const { messageData } = storeToRefs(buyProject)
const isMember = computed(() => messageData.value?.isMember ?? false)
</script>

<template>
  <div
    class="mt-[25px] space-y-[5px] border-t-[1px] border-t-[--gray-ccce] pt-[25px]"
    v-if="!isMember"
  >
    <b class="block text-[20px] font-medium">我們發現您還不是好房會員！</b>
    <p class="text-[16px] text-[--gray-666]">
      成為會員，即可追蹤您的留言紀錄，並可享有更多會員專屬功能
    </p>
  </div>
</template>

<style lang="postcss"></style>
