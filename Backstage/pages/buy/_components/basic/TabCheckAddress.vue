<script setup>
import Address from '@components/buy/mAddress.vue'
import Anchor from '@components/buy/mAnchor.vue'

import TabItem from '@pages/buy/_components/basic/TabItem.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'

import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { options } = storeToRefs(buyProject)
const apiData = ref({
  cityID: '',
  districtID: '',
  road: '',
  lane: '',
  alley: '',
  number: '',
  ofNumber: '',
  floor: '',
})
const areas = ref(null)
const items = readonly({
  label: 'disc',
  items: [
    {
      item: '刊登頁一律顯示到路段名；門牌資訊，僅用於地圖定位；如為預售屋，請輸入附近門牌供地圖定位。',
    },
    {
      item: '若無法匯入資訊，您可繼續手動填寫地址及其他資訊，完成刊登。',
    },
  ],
})

const onCityChange = async () => {
  const { status, data } = await buyProject.onApiGETDistrictSelectOptions(apiData.value.cityID)

  if (status === 200) {
    areas.value = data
  }
}

const onClick = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    console.log('address Import')
  }
}
</script>

<template>
  <Form as="div" v-slot="{ validate }">
    <div class="p:flex p:gap-x-[16px]">
      <Address
        name="info"
        v-model:city="apiData.cityID"
        v-model:area="apiData.districtID"
        v-model:road="apiData.road"
        v-model:lane="apiData.lane"
        v-model:alley="apiData.alley"
        v-model:number="apiData.number"
        v-model:ofNumber="apiData.ofNumber"
        v-model:floor="apiData.floor"
        :config="{
          options: {
            city: options.city,
            area: areas,
          },
          schema: {
            label: 'text',
            value: 'value',
          },
        }"
        :setClass="{
          main: 'grow',
          city: 'pt:w-[173px]',
          area: 'pt:w-[173px]',
          road: 'pt:w-[173px]',
          lane: 'm:w-[98px] pt:w-[80px]',
          alley: 'm:w-[98px] pt:w-[80px]',
          number: 'm:w-[98px] pt:w-[80px]',
          ofNumber: 'm:w-[74px] pt:w-[46px]',
          floor: 'm:w-[98px] pt:w-[80px]',
        }"
        @change:city="onCityChange"
      />
      <Anchor
        text="匯入資料"
        :setClass="{
          main: '--oval --height-40 --px-20 --py-5 --bg-green-6a2d --text-white shrink-0',
          text: 'font-semibold',
        }"
        @click="onClick(validate)"
      />
    </div>
    <TabItem
      :data="items"
      :setClass="{
        main: 'mt-[16px]',
      }"
    />
  </Form>
</template>

<style></style>
