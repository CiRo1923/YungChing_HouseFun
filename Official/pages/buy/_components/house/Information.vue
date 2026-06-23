<script setup>
const buyPopup = useBuyPopupStore()
const { onMergeBtns } = usePopupActions()
const { onCustom } = useBuyPopupActions()
const onPopup = async (id) => {
  if (id === 'askMessage') {
    await onCustom({
      id,
      title: '詢問與留言',
      btns: onMergeBtns(buyPopup.buttons.alert, [
        {
          label: '我要預約留言',
          type: 'sure',
          isClose: false,
        },
      ]),
    })
  }
}
</script>

<template>
  <PageBuyHouseContent title="基本資料">
    <div
      class="information-container divide-y-[1px] divide-[--gray-f2] tm:space-y-[20px] p:space-y-[25px]"
    >
      <PageBuyHouseInformationBasic @popup="onPopup" />
      <PageBuyHouseInformationPin />
      <PageBuyHouseInformationPrice @popup="onPopup" />
      <PageBuyHouseInformationOther />
      <PageBuyHouseInformationBarrierfree />
      <!-- <PageBuyHouseInformationFunction /> -->
      <PageBuyHouseInformationParking />
    </div>
  </PageBuyHouseContent>
</template>

<style lang="postcss">
@screen p {
  .information-container {
    > * {
      &:not(:first-child) {
        @apply pt-[25px];
      }
    }
  }
}

@screen tm {
  .information-container {
    > * {
      &:not(:first-child) {
        @apply pt-[20px];
      }
    }
  }
}
</style>
