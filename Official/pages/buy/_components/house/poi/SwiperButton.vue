<script setup>
const emits = defineEmits(['update:activeID'])
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

const onClick = (item) => {
  const { id } = item

  activeID.value = id
  emits('update:activeID', id)
}
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
      <em class="tm:text-[16px] p:text-[18px]">{{ item.label }}</em>
      <small class="text-[12px]">({{ item.data.length }})</small>
    </button>
  </BuyMSwiperHorizontal>
</template>

<style lang="postcss"></style>
