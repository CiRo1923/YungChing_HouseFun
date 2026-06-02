<script setup>
const buyPublish = useBuyPublishStore()
const { address } = storeToRefs(buyPublish)
const { onAddress } = useBuyPublishActions()

const onClick = (data) => {
  address.value = data
}
</script>

<template>
  <BuyCommonCustomPopup
    id="popupAddressGoogleMap"
    :setClass="{
      main: 'p:--w-1200 t:--w-720',
    }"
  >
    <div class="space-y-[8px]">
      <p class="text-[16px] tracking-wider">
        您可以點擊並拖曳以更改定位，當您更換地址資料時，系統將會重新自動定位。
      </p>
      <ClientOnly>
        <BuyMGoogleMap
          :config="{
            defaultAddress: '台北市大安區敦化南路二段77號',
            address: onAddress(),
          }"
          class="tm:h-[310px] p:h-[595px]"
          @click="onClick"
        />
      </ClientOnly>
    </div>
  </BuyCommonCustomPopup>
</template>

<style></style>
