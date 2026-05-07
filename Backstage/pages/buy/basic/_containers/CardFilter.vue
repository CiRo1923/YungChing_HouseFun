<script setup>
import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
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

const onBind = (item) => {
  const { setClass } = item

  return setClass
    ? {
        setClass,
      }
    : {}
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
  <BuyMCardFilter :title="props.title">
    <template #tools v-if="$slots.tools">
      <slot name="tools" />
    </template>
    <ul class="m:space-y-[40px] pt:space-y-[24px]">
      <template v-for="(item, index) in props.items">
        <li
          class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"
          :class="onHiddenClass(item)"
          :key="`${item.id}_${index}`"
          v-if="!onIsHidden(item)"
        >
          <BuyMFormLabel
            :label="item.label"
            :config="{
              isRequired: item.isRequired,
            }"
            :setClass="{
              main: ['pt:flex pt:w-[100px] pt:shrink-0 pt:items-center', item.class],
            }"
            v-if="item.label || $slots[`${item.id}_label`]"
          >
            <slot :name="`${item.id}_label`" />
          </BuyMFormLabel>
          <div class="overflow-hidden pt:grow">
            <component :is="item.component" v-bind="onBind(item)" />
          </div>
        </li>
      </template>
    </ul>
  </BuyMCardFilter>
</template>

<style></style>
