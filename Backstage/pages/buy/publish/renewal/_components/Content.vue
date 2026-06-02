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
        label="請選擇額度"
        icon="icon_quota"
        :setClass="{
          icon: 'text-[--gray-666]',
        }"
      />
      <PageBuyRenewalInfo
        :setClass="{
          hiddenForm: {
            main: 'text-center',
            error: 'mt-[4px]',
          },
        }"
      />
    </BuyMCardDefault>
  </div>
</template>

<style lang="postcss"></style>
