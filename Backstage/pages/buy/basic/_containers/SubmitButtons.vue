<script setup>
const emits = defineEmits(['click:draft', 'click:save'])

const onDraftClick = () => {
  emits('click:draft')
}

const onSaveClick = () => {
  emits('click:save')
}
</script>

<template>
  <BuyMCardDefault class="text-center">
    <ul class="inline-flex m:flex-col-reverse m:gap-y-[24px] pt:items-center pt:gap-x-[24px]">
      <li class="m:w-[230px]">
        <BuyMAnchor
          text="取消"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 w-full shrink-0',
            text: 'font-semibold',
          }"
        />
      </li>
      <li class="m:w-[230px]">
        <BuyMAnchor
          text="存成草稿"
          :setClass="{
            main: '--border-gray-e5 --bg-white --oval --h-45 --px-30 --py-8 --text-gray-666 w-full shrink-0',
            text: 'font-semibold',
          }"
          @click="onDraftClick"
        />
      </li>
      <li class="m:w-[230px]">
        <BuyMAnchor
          text="儲存，選擇刊登額度"
          :setClass="{
            main: '--bg-green-6a2d --oval --h-45 --px-30 --py-8 --text-white w-full shrink-0',
            text: 'font-semibold',
          }"
          @click="onSaveClick"
        />
      </li>
    </ul>
  </BuyMCardDefault>
</template>

<style></style>
