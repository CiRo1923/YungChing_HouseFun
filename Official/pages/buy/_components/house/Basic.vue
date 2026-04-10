<script setup>
import Content from '@components/common/mContent.vue'

import AddressInfo from '@pages/buy/_components/house/_basic/AddressInfo.vue'
import Media from '@pages/buy/_components/house/_basic/Media.vue'
import PriceInfo from '@pages/buy/_components/house/_basic/PriceInfo.vue'
import HouseInfo from '@pages/buy/_components/house/_basic/HouseInfo.vue'
import LayoutInfo from '@pages/buy/_components/house/_basic/LayoutInfo.vue'
import AccountInfo from '@pages/buy/_components/house/_basic/AccountInfo.vue'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { basic } = storeToRefs(buyHouse)
</script>

<template>
  <Content class="pt:--rounded-20 p:--p-24">
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
          <AddressInfo />
        </div>
        <Media />
      </div>
      <div class="flex flex-col items-end m:px-[16px] pt:grow">
        <PriceInfo />
        <div
          class="w-full m:px-[10px] m:py-[20px] t:p-[10px] tm:space-y-[8px] p:space-y-[12px] p:p-[15px]"
        >
          <HouseInfo />
          <LayoutInfo />
        </div>
        <div class="w-full border-t-[1px] border-t-[--gray-e5] tm:pt-[20px] p:pt-[35px]">
          <AccountInfo />
        </div>
        <!-- <pre>
          {{ house }}
        </pre> -->
      </div>
    </div>
  </Content>
</template>

<style></style>
