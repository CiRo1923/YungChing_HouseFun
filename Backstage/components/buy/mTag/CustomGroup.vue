<script setup>
const emits = defineEmits(['update:modelValue'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  // modelModifiers: {
  //   type: Object,
  //   default: () => ({}),
  // },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const items = ref([])
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    emits('update:modelValue', value)
  },
})

const config = computed(() => {
  return {
    maxItems: null,
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    tag: '',
    ...props.setClass,
  }
})

const onHasValue = (value) => {
  return value !== null && value !== undefined && `${value}`.trim() !== ''
}

const maxItems = computed(() => {
  const value = Number(config.value.maxItems)

  return Number.isFinite(value) && value > 0 ? value : null
})

const onLimitItems = (value = []) => {
  if (!maxItems.value) return value

  return value.slice(0, maxItems.value)
}

const onCanAppendEmptyItem = (value = items.value) => {
  return !maxItems.value || value.filter(onHasValue).length < maxItems.value
}

const onNormalizeItems = (value = []) => {
  const hasValueItems = value.filter(onHasValue)
  const nextValue = onLimitItems(hasValueItems)

  items.value = onCanAppendEmptyItem(nextValue) ? [...nextValue, ''] : nextValue

  if (nextValue.length !== hasValueItems.length) {
    model.value = nextValue
  }
}

watch(
  [() => props.modelValue, maxItems],
  ([value]) => {
    onNormalizeItems(value)
  },
  {
    immediate: true,
    deep: true,
  }
)

const onSyncModel = () => {
  model.value = onLimitItems(items.value.filter(onHasValue))
}

const onUpdateItem = (index, value) => {
  items.value[index] = value
}

const onBlurItem = (index, value) => {
  if (!onHasValue(value)) {
    if (index !== items.value.length - 1) {
      onSyncModel()
      onNormalizeItems(items.value)
    }
    return
  }

  onSyncModel()

  if (index === items.value.length - 1 && onCanAppendEmptyItem()) {
    items.value.push('')
  }
}
</script>

<template>
  <ul class="m-tag-custom-group flex flex-wrap items-center p:gap-x-[8px]" :class="setClass.main">
    <li v-for="(item, index) in items" :key="`${props.name}_${index}`">
      <BuyMTagCustom
        :name="`${props.name}[${index}]`"
        :modelValue="item"
        :config="config"
        :setClass="setClass.tag"
        @update:model-value="onUpdateItem(index, $event)"
        @blur="onBlurItem(index, $event)"
      />
    </li>
  </ul>
</template>

<style></style>
