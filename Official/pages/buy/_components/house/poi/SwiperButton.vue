<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const emits = defineEmits(['update:activeID', 'update:anchorIndex'])
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeID: {
    type: String,
    default: null,
  },
})

const activeID = ref(props.activeID)
const isDeviceM = computed(() => device.value === 'm')

const onClick = (item) => {
  const { id } = item

  activeID.value = id
  emits('update:anchorIndex', null)
  emits('update:activeID', id)
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
  <BuyMSwiperHorizontal
    name="poiMapCtrl"
    :data="props.items"
    :config="{
      nav: false,
      slidesPerView: {
        p: 8,
        t: 5.5,
        m: 3.4,
      },
    }"
    :setClass="{
      main: 'h-full',
    }"
    v-slot="{ item }"
  >
    <button
      type="button"
      class="flex w-full items-center justify-center gap-x-[5px] px-[10px] text-center text-[--white] transition-colors duration-300 tm:h-[45px] p:h-[50px]"
      :class="[activeID === item.id ? 'bg-[--green-8b0d]' : 'bg-[--gray-666]']"
      @click="onClick(item)"
    >
      <CommonSvgIcon :icon="item.icon" class="h-[18px] w-[18px] p-[1px]" v-if="!isDeviceM" />
      <em class="tm:text-[16px] p:text-[18px]">{{ item.label }}</em>
      <small class="text-[12px]">({{ item.data.length }})</small>
    </button>
  </BuyMSwiperHorizontal>
</template>
