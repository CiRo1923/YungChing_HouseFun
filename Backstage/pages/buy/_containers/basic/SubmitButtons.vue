<script setup>
import CardDefault from '@components/buy/mCard/Default.vue'
import Anchor from '@components/buy/mAnchor.vue'

const emits = defineEmits(['click:draft', 'click:save'])

const onDraftClick = () => {
  emits('click:draft')
}

const onSaveClick = () => {
  emits('click:save')
}
</script>

<template>
  <CardDefault class="text-center">
    <ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]">
      <li>
        <Anchor
          text="取消"
          :setClass="{
            main: ' --border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 shrink-0',
            text: 'font-semibold',
          }"
        />
      </li>
      <li>
        <Anchor
          text="存成草稿"
          :setClass="{
            main: ' --border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 shrink-0',
            text: 'font-semibold',
          }"
          @click="onDraftClick"
        />
      </li>
      <li>
        <Anchor
          text="儲存，選擇刊登額度"
          :setClass="{
            main: '  --bg-green-6a2d --oval --h-45 --px-30 --py-8 --text-white shrink-0',
            text: 'font-semibold',
          }"
          @click="onSaveClick"
        />
      </li>
    </ul>
  </CardDefault>
</template>

<style></style>
