<script setup>
import AccordionContent from '@components/buy/mAccordion/Content.vue'

import Content from '@pages/buy/_components/house/_Content.vue'
import Basic from '@pages/buy/_components/house/information/Basic.vue'
import Pin from '@pages/buy/_components/house/information/Pin.vue'
import Parking from '@pages/buy/_components/house/information/Parking.vue'
import Price from '@pages/buy/_components/house/information/Price.vue'
import Other from '@pages/buy/_components/house/information/Other.vue'
import Function from '@pages/buy/_components/house/information/Function.vue'
</script>

<template>
  <Content
    title="基本資料"
    :config="{
      icon: 'icon_house_info',
    }"
  >
    <AccordionContent>
      <div class="information-container divide-y-[1px] divide-[--gray-ccce] p:space-y-[30px]">
        <Basic />
        <Pin />
        <Parking />
        <Price />
        <Other />
        <Function />
      </div>
    </AccordionContent>
  </Content>
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
</style>
