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
      class="information-container divide-y-[1px] divide-[--gray-ccce] tm:space-y-[20px] p:space-y-[30px]"
    >
      <PageBuyHouseInformationBasic @popup="onPopup" />
      <PageBuyHouseInformationPin />
      <PageBuyHouseInformationParking />
      <PageBuyHouseInformationPrice @popup="onPopup" />
      <PageBuyHouseInformationOther />
      <PageBuyHouseInformationFunction />
    </div>
  </PageBuyHouseContent>
</template>

<style lang="postcss">
@screen p {
  .information-container {
    > * {
      &:not(:first-child) {
        @apply pt-[30px];
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
