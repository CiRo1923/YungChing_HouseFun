<script setup>
import CardFilter from '@components/buy/mCard/Filter.vue'
import FormLabel from '@components/buy/mForm/Label.vue'

import { onDevice } from '@js/_prototype.js'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
})
const device = ref('p')

const onIsHidden = (item) => {
  const { hiddenDevice } = item
  if (!hiddenDevice) return false

  const regex = new RegExp(device.value)
  return regex.test(item.hiddenDevice)
}

const onHiddenClass = (item) => {
  const { hiddenDevice } = item

  if (hiddenDevice === 'p') return 'p:hidden'
  if (hiddenDevice === 'pt') return 'pt:hidden'
  if (hiddenDevice === 't') return 't:hidden'
  if (hiddenDevice === 'tm') return 'tm:hidden'
  if (hiddenDevice === 'm') return 'm:hidden'

  return ''
}

const onResize = () => {
  device.value = onDevice()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <CardFilter :title="props.title">
    <ul class="tm:space-y-[40px] p:space-y-[24px]">
      <template v-for="(item, index) in props.items">
        <li
          class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"
          :class="onHiddenClass(item)"
          :key="`${item.id}_${index}`"
          v-if="!onIsHidden(item)"
        >
          <FormLabel
            :label="item.label"
            :config="{
              isRequired: item.isRequired,
            }"
            :setClass="{
              main: ['pt:flex pt:w-[100px] pt:shrink-0 pt:items-center', item.class],
            }"
            v-if="item.label"
          />
          <div class="pt:grow">
            <component :is="item.component" />
          </div>
        </li>
      </template>
    </ul>
  </CardFilter>
</template>

<style></style>
