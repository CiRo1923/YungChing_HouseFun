<script setup>
import Address from '@components/buy/mAddress.vue'
import Anchor from '@components/buy/mAnchor.vue'

import TabItem from '@pages/buy/_components/basic/TabItem.vue'

import { useBuyProjectStore } from '@stores/buy/project.js'
import useStores from '@stores/buy/_composables/useStores.js'

import { Form } from 'vee-validate'

const buyProject = useBuyProjectStore()
const { project } = useStores()
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
const areas = ref([])
const roads = ref([])
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
  const { status, data } = await project.onApiGETDistrictSelectOptions(apiData.value.cityID)

  areas.value = []
  roads.value = []

  if (status === 200) {
    areas.value = data
  }
}

const onAreaChange = async () => {
  const { cityID, districtID } = apiData.value

  roads.value = []

  const { status, data } = await project.onApiGETRoad(cityID, districtID)

  if (status === 200) {
    roads.value = data
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
          city: {
            options: options.city,
            schema: {
              label: 'text',
              value: 'value',
            },
          },
          area: {
            options: areas,
            schema: {
              label: 'text',
              value: 'value',
            },
          },
          road: {
            options: roads,
            schema: {
              label: 'roadName',
              value: 'roadID',
            },
          },
        }"
        :setClass="{
          main: 'grow',
          city: 'pt:w-[182px]',
          area: 'pt:w-[182px]',
          road: 'pt:w-[182px]',
          lane: 'm:w-[98px] pt:w-[80px]',
          alley: 'm:w-[98px] pt:w-[80px]',
          number: 'm:w-[98px] pt:w-[80px]',
          ofNumber: 'm:w-[74px] pt:w-[50px]',
          floor: 'm:w-[98px] pt:w-[80px]',
        }"
        @change:city="onCityChange"
        @change:area="onAreaChange"
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
