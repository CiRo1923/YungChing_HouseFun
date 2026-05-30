<script setup>
import { numberComma } from '@js/_prototype.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits([
  'update:checked',
  'click:publish',
  'click:offline',
  'click:deal',
  'click:remove',
  'click:view',
  'click:comment',
])
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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <section class="flex m:flex-col pt:items-center pt:gap-x-[24px]">
    <div class="flex m:relative m:flex-col pt:grow pt:items-center p:gap-x-[16px]">
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
          <PageBuyListItemHot
            :data="props.data"
            @click:view="(data) => onEventsClick('view', data)"
            @click:comment="(data) => onEventsClick('comment', data)"
          />
          <PageBuyListItemEvents
            :data="props.data"
            :items="eventsItems"
            @click:publish="(data) => onEventsClick('publish', data)"
            @click:offline="(data) => onEventsClick('offline', data)"
            @click:deal="(data) => onEventsClick('deal', data)"
            @click:remove="(data) => onEventsClick('remove', data)"
            v-if="!isDeviceM && hasEventsItem"
          />
        </div>
      </div>
      <div
        class="relative order-2 shrink-0 overflow-hidden rounded-[10px] m:mb-[16px] m:h-[242px] t:h-[114px] t:w-[150px] p:h-[152px] p:w-[200px]"
      >
        <CommonImgSrc
          :src="props.data.picURLCover"
          :alt="props.data.caseTitle"
          :setClass="{
            main: 'h-full w-full',
          }"
        />
        <div>
          <span
            class="m:roundef-l-full absolute top-0 flex h-[22px] items-center bg-[--orange-e646] px-[12px] text-[14px] leading-[1] tracking-wider text-[--white] m:right-0 m:rounded-l-full pt:left-0 pt:rounded-r-full"
            v-if="props.data.isGolden"
          >
            黃金曝光
          </span>
          <span
            class="bg-hexa-[--black,0.7] absolute bottom-0 left-0 flex h-[22px] items-center rounded-r-full px-[12px] text-[14px] leading-[1] tracking-wider text-[--white]"
          >
            {{ props.data.isCaseExchange ? '可換' : '不可換' }}
          </span>
          <span
            class="bg-hexa-[--black,0.7] absolute bottom-0 right-0 flex h-[22px] items-center rounded-l-full px-[12px] text-[14px] leading-[1] tracking-wider text-[--white]"
          >
            {{ props.data.hfID }}
          </span>
        </div>
      </div>
      <BuyMFormCheckBox
        :name="`checked[${props.data.hfID}]`"
        v-model="modelIsChecked"
        :config="{
          mode: 'boolean',
          isDisabled: props.data._checked.disabled,
        }"
        :setClass="{
          main: 'shrink-0 m:absolute m:left-[12px] m:top-[5px] m:z-[1]',
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
      @click:remove="(data) => onEventsClick('remove', data)"
      v-if="isDeviceM && hasEventsItem"
    />
  </section>
</template>

<style lang="postcss"></style>
