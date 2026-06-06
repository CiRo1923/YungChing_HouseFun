<script setup>
const buyList = useBuyListStore()
const { apiCommentUpdateData } = storeToRefs(buyList)
const popup = usePopupStore()
const { customData } = storeToRefs(popup)
const data = computed(() => customData.value.data || {})
const isReply = computed(() => data.value.type === 'reply')
const isNoReply = computed(() => data.value.type === 'noReply')
const text = computed(() => (isReply.value ? '已回覆' : isNoReply.value ? '未回覆' : null))
</script>

<template>
  <BuyCommonCustomPopup
    id="popupCommentsReply"
    :setClass="{
      main: 'p:--w-800 t:--w-600',
    }"
  >
    <div class="text-[16px] text-[--gray-666]">
      <template v-if="!data.item">
        <p>已選擇 {{ apiCommentUpdateData.commentIDList.length }} 筆留言，</p>
        <p>
          確定將這些留言設為 <b class="font-medium">[{{ text }}]</b>?
        </p>
      </template>
      <p v-else>
        確定將此則留言設為 <b class="font-medium">[{{ text }}]</b>?
      </p>
    </div>
  </BuyCommonCustomPopup>
</template>

<style lang="postcss"></style>
