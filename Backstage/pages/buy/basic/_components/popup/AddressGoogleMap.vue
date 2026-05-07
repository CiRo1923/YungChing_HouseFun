<script setup>
import CustomPopup from '@containers/buy/common/CustomPopup.vue'
import useBuyBasicActions from '@stores/buy/composables/useBasicActions.js'

const { onAddress } = useBuyBasicActions()
const addressData = ref(null)

const onClick = (data) => {
  addressData.value = data
}
</script>

<template>
  <CustomPopup
    id="popupAddressGoogleMap"
    :config="{
      data: addressData,
    }"
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
  </CustomPopup>
</template>

<style></style>
