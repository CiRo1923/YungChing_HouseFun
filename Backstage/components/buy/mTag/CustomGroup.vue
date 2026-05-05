<script setup>
const emits = defineEmits(['update:modelValue'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Array],
    default: undefined,
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

const config = computed(() => {
  return {
    maxItems: null,
    isJoin: false,
    ...props.config,
  }
})

const joinSep = computed(() => {
  const { isJoin } = config.value

  if (isJoin === true) return ','
  if (typeof isJoin === 'string' && isJoin.length) return isJoin

  return null
})

const model = computed({
  get() {
    const sep = joinSep.value

    if (Array.isArray(props.modelValue)) return props.modelValue

    if (sep && typeof props.modelValue === 'string') {
      return props.modelValue
        ? props.modelValue
            .split(sep)
            .map((item) => item.trim())
            .filter(Boolean)
        : []
    }

    if (typeof props.modelValue === 'string') return props.modelValue ? [props.modelValue] : []

    return []
  },
  set(value) {
    const sep = joinSep.value

    if (sep && Array.isArray(value)) {
      emits('update:modelValue', value.join(sep))
      return
    }

    emits('update:modelValue', value)
  },
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
  [() => props.modelValue, maxItems, joinSep],
  () => {
    onNormalizeItems(model.value)
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

const onRemoveItem = (index) => {
  items.value.splice(index, 1)
  onSyncModel()
  onNormalizeItems(items.value)
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
        @remove="onRemoveItem(index)"
      />
    </li>
  </ul>
</template>

<style></style>
