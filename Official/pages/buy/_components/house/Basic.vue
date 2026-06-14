<script setup>
const buyHouse = useBuyHouseStore()
const { basic } = storeToRefs(buyHouse)
</script>

<template>
  <CommonMContent class="pt:--rounded-20 p:--p-24">
    <div class="t:gap-x-[10px] pt:flex p:gap-x-[15px]">
      <div
        class="m:flex m:flex-col-reverse t:space-y-[10px] pt:shrink-0 p:w-[760px] p:space-y-[15px]"
      >
        <div
          class="relative z-[1] m:mt-[-20px] m:space-y-[3px] m:rounded-[20px] m:bg-[--white] m:px-[16px] m:pt-[20px] t:space-y-[10px] p:space-y-[15px]"
        >
          <header>
            <h2>
              <strong class="tm:text-[20px] p:text-[30px]">{{ basic.title }}</strong>
            </h2>
          </header>
          <PageBuyHouseBasicAddressInfo />
        </div>
        <PageBuyHouseBasicMedia />
      </div>
      <div class="flex flex-col items-end m:px-[16px] pt:grow">
        <PageBuyHouseBasicPriceInfo />
        <div
          class="w-full m:px-[10px] m:py-[20px] t:p-[10px] tm:space-y-[8px] p:space-y-[12px] p:p-[15px]"
        >
          <PageBuyHouseBasicHouseInfo />
          <PageBuyHouseBasicLayoutInfo />
        </div>
        <div class="w-full border-t-[1px] border-t-[--gray-e5] tm:pt-[20px] p:pt-[35px]">
          <PageBuyHouseBasicAccountInfo />
        </div>
        <!-- <pre>
          {{ house }}
        </pre> -->
      </div>
    </div>
  </CommonMContent>
</template>

<style></style>
