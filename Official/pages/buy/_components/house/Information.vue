<script setup>
import Content from '@pages/buy/_components/house/_Content.vue'
import Basic from '@pages/buy/_components/house/_information/Basic.vue'
import Pin from '@pages/buy/_components/house/_information/Pin.vue'
import Parking from '@pages/buy/_components/house/_information/Parking.vue'
import Price from '@pages/buy/_components/house/_information/Price.vue'
import Other from '@pages/buy/_components/house/_information/Other.vue'
import Function from '@pages/buy/_components/house/_information/Function.vue'

import { useBuyPopupStore } from '@stores/buy/popup.js'
import usePopupActions from '@stores/_composables/usePopupActions.js'
import useBuyPopupActions from '@stores/buy/_composables/usePopupActions.js'

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
  <Content
    title="基本資料"
    :config="{
      icon: 'icon_house_info',
    }"
  >
    <BuyMAccordionContent>
      <div
        class="information-container divide-y-[1px] divide-[--gray-ccce] tm:space-y-[20px] p:space-y-[30px]"
      >
        <Basic @popup="onPopup" />
        <Pin />
        <Parking />
        <Price @popup="onPopup" />
        <Other />
        <Function />
      </div>
    </BuyMAccordionContent>
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
