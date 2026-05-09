<script setup>
import Address from '@pages/buy/_components/Address.vue'
import Information from '@pages/buy/list/_components/item/Information.vue'
import Hot from '@pages/buy/list/_components/item/Hot.vue'
import Events from '@pages/buy/list/_components/item/Events.vue'

import { numberComma } from '@js/_prototype.js'

import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['update:isSelect', 'click:publish', 'click:removed', 'click:done'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  eventsItems: {
    type: Array,
    default: () => [],
  },
  isSelect: {
    type: Boolean,
    default: false,
  },
})

const isDeviceM = computed(() => device.value === 'm')
const modelIsSelect = computed({
  get: () => props.isSelect,
  set: (value) => {
    emits('update:isSelect', value)
  },
})
const hasEventsItem = computed(() => props.eventsItems && props.eventsItems.length !== 0)
const addressData = computed(() => {
  const keyMap = {
    caseAddr: 'address',
    buName: 'community',
  }

  return Object.fromEntries(
    Object.entries(props.data)
      .filter(([key]) => keyMap[key])
      .map(([key, value]) => [keyMap[key], value])
  )
})

const onEventsClick = (id, data) => {
  emits(`click:${id}`, data)
}

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
</script>

<template>
  <section class="flex m:flex-col pt:items-center pt:gap-x-[24px]">
    <div class="flex m:flex-col pt:grow pt:items-center p:gap-x-[16px]">
      <div class="order-3 grow">
        <header class="mb-[8px]">
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
              }"
            />
          </h3>
        </header>
        <div class="m:mb-[8px] pt:mb-[4px] pt:flex pt:items-center">
          <span class="text-[18px] text-[--orange-e646] pt:order-2 pt:shrink-0">
            {{ numberComma.add(props.data.casePrice) }} 萬
          </span>
          <Address :data="addressData" />
        </div>
        <Information :data="props.data" />
        <div class="m:mt-[8px] pt:flex pt:items-center p:mt-[20px]">
          <Hot :data="props.data" />
          <Events
            :data="props.data"
            :items="eventsItems"
            @click:publish="(data) => onEventsClick('publish', data)"
            @click:removed="(data) => onEventsClick('removed', data)"
            @click:done="(data) => onEventsClick('done', data)"
            v-if="!isDeviceM && hasEventsItem"
          />
        </div>
      </div>
      <CommonImgSrc
        :src="props.data.picURLCover"
        :alt="props.data.caseTitle"
        :setClass="{
          main: 'order-2 shrink-0 overflow-hidden m:mb-[16px] m:h-[242px] t:h-[114px] t:w-[150px] p:h-[152px] p:w-[200px]',
        }"
      />
      <BuyMFormCheckBox
        :name="`isSelect[${props.data.hfID}]`"
        v-model="modelIsSelect"
        :config="{
          mode: 'boolean',
        }"
      />
    </div>
    <slot />
    <Events
      :data="props.data"
      :items="eventsItems"
      @click:publish="(data) => onEventsClick('publish', data)"
      @click:removed="(data) => onEventsClick('removed', data)"
      @click:done="(data) => onEventsClick('done', data)"
      v-if="isDeviceM && hasEventsItem"
    />
  </section>
</template>

<style lang="postcss"></style>
