<script setup>
const buyProject = useBuyProjectStore()
const { renewal } = storeToRefs(buyProject)
const { onResetPojectData } = useBuyProjectActions()
const publishInfo = computed(() => {
  const keyMap = {
    caseTitle: 'title',
    caseAddress: 'address',
    buName: 'community',
    casePrice: 'price',
    pucURLCover: 'cover',
  }

  return renewal.value.data
    ? Object.fromEntries(
        Object.entries(renewal.value.data)
          .filter(([key]) => keyMap[key])
          .map(([key, value]) => [keyMap[key], value])
      )
    : null
})

onResetPojectData('renewal')
</script>

<template>
  <div class="tm:space-y-[24px] p:space-y-[32px]">
    <BuyMCardDefault>
      <PageBuyPublishInfo :data="publishInfo" v-if="publishInfo" />
    </BuyMCardDefault>
    <BuyMCardDefault
      :setClass="{
        main: 'tm:space-y-[16px] p:space-y-[24px]',
      }"
    >
      <PageBuyPublishLabelText
        label="物件刊登完成"
        icon="icon_check_solid"
        :setClass="{
          icon: 'text-[--orange-e646]',
        }"
      />
      <PageBuyFinishInfo />
    </BuyMCardDefault>
  </div>
</template>

<style lang="postcss"></style>
