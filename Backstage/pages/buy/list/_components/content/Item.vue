<script setup>
import Address from '@pages/buy/list/_components/content/Address.vue'
import Information from '@pages/buy/list/_components/content/Information.vue'
import Hot from '@pages/buy/list/_components/content/Hot.vue'
import Events from '@pages/buy/list/_components/content/Events.vue'
import Setting from '@pages/buy/list/_components/Setting.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <section class="flex m:flex-col">
    <div class="order-2 grow">
      <header>
        <h3 class="font-normal">
          <BuyMAnchor
            :text="props.data.caseTitle"
            :to="{
              name: 'buy-basic-id',
              params: {
                id: props.data.hfID,
              },
            }"
            :setClass="{
              main: 'tracking-wider underline p:text-[18px]',
              text: 'font-normal',
            }"
          />
        </h3>
      </header>
      <div class="m:mb-[8px] pt:mb-[4px] pt:flex pt:items-center">
        <span class="text-[18px] text-[--orange-e646] pt:order-2 pt:shrink-0">
          {{ props.data.casePrice }} 萬
        </span>
        <Address :data="props.data" />
      </div>
      <Information :data="props.data" />
      <div class="pt:flex pt:items-center p:mt-[20px]">
        <Hot :data="props.data" />
        <Events :data="props.data" />
      </div>
    </div>
    <Setting :data="props.data" class="p:ml-[24px]" />
    <CommonImgSrc
      :src="props.data.picURLCover"
      :alt="props.data.caseTitle"
      :setClass="{
        main: 'order-1 shrink-0 p:mr-[16px] p:h-[152px] p:w-[200px]',
      }"
    />
  </section>
</template>

<style lang="postcss"></style>
