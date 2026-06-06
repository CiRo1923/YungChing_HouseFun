<script setup>
const buyList = useBuyListStore()
const { commentsDatas, apiCommentUpdateData } = storeToRefs(buyList)
const isSelectAll = computed({
  get() {
    return (
      commentsDatas.value &&
      commentsDatas.value.length > 0 &&
      commentsDatas.value.every((item) => item._checked)
    )
  },
  set(value) {
    commentsDatas.value = commentsDatas.value.map((item) => ({
      ...item,
      _checked: value,
    }))
  },
})

const onChange = () => {
  apiCommentUpdateData.value.commentIDList = commentsDatas.value
    ? commentsDatas.value.filter((item) => item._checked).map((item) => item.commentID)
    : []
}
</script>

<template>
  <BuyMFormCheckBox
    name="isCommentsSelectAll"
    v-model="isSelectAll"
    :config="{
      mode: 'boolean',
      label: '全選',
    }"
    :setClass="{
      main: 'm:order-1',
      label: 'text-[16px]',
    }"
    @change="onChange"
  />
</template>

<style lang="postcss"></style>
