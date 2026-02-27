<script setup>
import FormLabel from '@components/buy/mForm/Label.vue'
import FormInput from '@components/buy/mForm/Input.vue'
import Anchor from '@components/buy/mAnchor.vue'

import TabItem from '@pages/buy/_components/basic/TabItem.vue'

import { Form } from 'vee-validate'

const url = ref(null)
const items = readonly({
  label: 'disc',
  items: [
    {
      item: '您可以輸入其他房仲網站的物件網址，系統將為您快速帶入資料，匯入後您仍可修改資料。',
    },
    {
      item: '支援匯入網站：591、Yes319、21 世紀不動產、ERA 易而安、大家房屋、大師房屋、中信房屋、太平洋房屋、台灣房屋、永春不動產、永義房屋、永慶房仲網、全國不動產、好房網、住商不動產、幸福家不動產、東森房屋、東龍不動產、信義房屋、南北房屋、惠雙房屋、群義房屋、樂屋網。',
    },
    {
      item: '各品牌物件資料更新需要作業時間，若匯入物件失敗時，請於 2-3 小時後再次匯入。',
    },
  ],
})

const onClick = async (validate) => {
  const { valid } = await validate()

  if (valid) {
    console.log('url Import')
  }
}
</script>

<template>
  <Form as="div" v-slot="{ validate }">
    <div class="p:flex p:gap-x-[16px]">
      <FormLabel
        label="網址匯入"
        :config="{
          isRequired: false,
        }"
        :setClass="{
          main: 'shrink-0 p:ml-[12px] p:flex p:h-[40px] p:items-center',
        }"
      />
      <FormInput
        name="URL"
        v-model="url"
        :config="{
          placeholder: '請輸入',
        }"
        :rules="{
          custom: {
            valid: /^http/.test(url),
            errorMessage: '請輸入正確網址格式',
          },
        }"
        :setClass="{
          main: '--height-40 --px-12 --py-8 grow',
        }"
      />
      <Anchor
        text="匯入資料"
        :config="{
          isDisabled: !url,
        }"
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
