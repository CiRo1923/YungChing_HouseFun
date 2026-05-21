<script setup>
import { numberComma } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['update:checked', 'click:publish', 'click:offline', 'click:deal'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  eventsItems: {
    type: Array,
    default: () => [],
  },
  checked: {
    type: Boolean,
    default: false,
  },
})

const isDeviceM = computed(() => device.value === 'm')
const modelIsChecked = computed({
  get: () => props.checked,
  set: (value) => {
    emits('update:checked', value)
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
          <h3 class="font-normal tracking-wider tm:text-[16px] p:text-[18px]">
            <BuyMAnchor
              :text="props.data.caseTitle"
              :to="{
                name: 'buy-publish-basic-id',
                params: {
                  id: props.data.hfID,
                },
              }"
              :setClass="{
                main: 'underline',
              }"
              v-if="props.data.caseStatue !== '3'"
            />
            <em v-else>{{ props.data.caseTitle }}</em>
          </h3>
          <!-- <pre>
            {{ props.data.caseOfflineInfo }}

          </pre> -->
          <!-- {{ props.data._checked }} -->
        </header>
        <div class="m:mb-[8px] pt:mb-[4px] pt:flex pt:items-center">
          <span class="text-[18px] text-[--orange-e646] pt:order-2 pt:shrink-0">
            {{ numberComma.add(props.data.casePrice) }} 萬
          </span>
          <PageBuyAddress
            :data="addressData"
            :setClass="{
              main: 'text-[14px] text-[--gray-666] pt:order-1',
            }"
          />
        </div>
        <PageBuyListItemInformation :data="props.data" />
        <div class="m:mt-[8px] pt:flex pt:items-center p:mt-[20px]">
          <PageBuyListItemHot :data="props.data" />
          <PageBuyListItemEvents
            :data="props.data"
            :items="eventsItems"
            @click:publish="(data) => onEventsClick('publish', data)"
            @click:offline="(data) => onEventsClick('offline', data)"
            @click:deal="(data) => onEventsClick('deal', data)"
            v-if="!isDeviceM && hasEventsItem"
          />
        </div>
      </div>
      <CommonImgSrc
        :src="props.data.picURLCover"
        :alt="props.data.caseTitle"
        :setClass="{
          main: 'order-2 shrink-0 overflow-hidden rounded-[10px] m:mb-[16px] m:h-[242px] t:h-[114px] t:w-[150px] p:h-[152px] p:w-[200px]',
        }"
      />
      <BuyMFormCheckBox
        :name="`checked[${props.data.hfID}]`"
        v-model="modelIsChecked"
        :config="{
          mode: 'boolean',
          isDisabled: props.data._checked.disabled,
        }"
        :setClass="{
          main: 'shrink-0',
        }"
      />
    </div>
    <slot />
    <PageBuyListItemEvents
      :data="props.data"
      :items="eventsItems"
      @click:publish="(data) => onEventsClick('publish', data)"
      @click:offline="(data) => onEventsClick('offline', data)"
      @click:deal="(data) => onEventsClick('deal', data)"
      v-if="isDeviceM && hasEventsItem"
    />
  </section>
</template>

<style lang="postcss"></style>
