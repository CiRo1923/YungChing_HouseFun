<script setup>
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)

const emits = defineEmits(['update:data', 'update:min', 'update:max'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  min: {
    type: [String, Number],
    default: null,
  },
  minModifiers: {
    type: Object,
    default: () => ({}),
  },
  max: {
    type: [String, Number],
    default: null,
  },
  maxModifiers: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})
const modelData = computed({
  get: () => props.data,
  set: (value) => {
    emits('update:data', value)
  },
})
const modelMin = computed({
  get: () => props.min,
  set: (value) => {
    let result = value

    if (props.minModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:min', result)
  },
})
const modelMax = computed({
  get: () => props.max,
  set: (value) => {
    let result = value

    if (props.maxModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:max', result)
  },
})

const config = computed(() => {
  return {
    placeholder: {
      min: '',
      max: '',
    },
    maxlength: 2,
    suffix: null,
    schema: {
      api: null,
    },
    ...props.config,
  }
})

const onBlur = () => {
  const { schema } = config.value
  const hasRange = modelData.value.range && (modelMax.value || modelMin.value)
  const max = Number(modelMax.value)
  const min = Number(modelMin.value)
  const isSame = !!(max && min && max === min)

  if (hasRange) modelData.value.range = [null]
  if (!hasRange) modelData.value.range = []

  if (max && min && max < min) {
    modelMin.value = max
    modelMax.value = min
  }

  if (isSame) {
    apiSearchData.value[schema.api] = modelMin.value
  }

  if (modelMax.value && modelMin.value) {
    apiSearchData.value[schema.api] = `${modelMin.value}-${modelMax.value}`
  } else if (modelMin.value) {
    apiSearchData.value[schema.api] = `${modelMin.value}-`
  } else if (modelMax.value) {
    apiSearchData.value[schema.api] = `-${modelMax.value}`
  }
}
</script>

<template>
  <div class="flex items-center gap-x-[10px]">
    <BuyMFormInput
      :name="`${props.name}min`"
      v-model.number="modelMin"
      :config="{
        placeholder: config.placeholder.min,
        inputMode: 'numeric',
        maxlength: config.maxlength,
        inputChinese: false,
        hasClearButton: false,
        integer: true,
        checkNotIsZero: true,
      }"
      :setClass="{
        main: '--h-35 --px-12 --py-5 --border --rounded flex-1',
      }"
      @blur="onBlur"
    />
    <span class="shrink-0">-</span>
    <BuyMFormInput
      :name="`${props.name}max`"
      v-model.number="modelMax"
      :config="{
        placeholder: config.placeholder.max,
        inputMode: 'numeric',
        maxlength: config.maxlength,
        inputChinese: false,
        hasClearButton: false,
        integer: true,
        checkNotIsZero: true,
      }"
      :setClass="{
        main: '--h-35 --px-12 --py-5 --border --rounded flex-1',
      }"
      @blur="onBlur"
    />
    <span class="shrink-0">{{ config.suffix }}</span>
  </div>
</template>

<style lang="postcss"></style>
