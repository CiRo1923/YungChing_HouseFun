<script setup>
const buyList = useBuyListStore()
const { commentsDatas } = storeToRefs(buyList)
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
</script>

<template>
  <CommonMFormCheckBox
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
  />
</template>
