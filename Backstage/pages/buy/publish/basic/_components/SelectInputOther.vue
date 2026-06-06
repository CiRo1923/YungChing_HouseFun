<script setup>
const emits = defineEmits(['update:select', 'update:other'])

const props = defineProps({
  selectName: {
    type: String,
    default: null,
  },
  select: {
    type: [String, Number],
    default: undefined,
  },
  selectModifiers: {
    type: Object,
    default: () => ({}),
  },
  otherName: {
    type: String,
    default: null,
  },
  other: {
    type: [String, Number],
    default: undefined,
  },
  otherModifiers: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  selectRules: {
    type: Object,
    default: () => ({}),
  },
  otherRules: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})
const modelSelect = computed({
  get: () => props.select,
  set: (value) => {
    let result = value

    if (props.selectModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:select', result)

    if (!isOtherSelect(result)) {
      clearOther()
    }
  },
})
const modelOther = computed({
  get: () => props.other ?? '',
  set: (value) => {
    let result = value

    if (!isOtherSelect(modelSelect.value)) {
      clearOther()
      return
    }

    if (props.otherModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:other', result)
  },
})

const isOtherSelect = (value) => String(value) === '999'

const clearOther = () => {
  if ((props.other ?? '') === '') return

  emits('update:other', '')
}

watch(
  modelSelect,
  (value) => {
    if (!isOtherSelect(value)) {
      clearOther()
    }
  },
  { immediate: true }
)

const config = computed(() => {
  return {
    select: {
      placeholder: null,
      options: null,
      schema: {
        label: 'label',
        value: 'value',
      },
    },
    other: {
      placeholder: null,
    },
    ...props.config,
  }
})

const setClass = computed(() => {
  return {
    main: '',
    select: {},
    other: {},
    ...props.setClass,
  }
})
</script>

<template>
  <div :class="setClass.main">
    <BuyMFormSelect
      :name="props.selectName"
      v-model="modelSelect"
      :options="config.select.options"
      :config="{
        placeholder: config.select.placeholder,
        schema: config.select.schema,
      }"
      :rules="props.selectRules"
      :setClass="setClass.select"
    />
    <BuyMFormInput
      v-if="isOtherSelect(modelSelect)"
      :name="props.otherName"
      v-model="modelOther"
      :config="{
        placeholder: config.other.placeholder,
      }"
      :rules="props.otherRules"
      :setClass="setClass.other"
    />
  </div>
</template>

<style lang="postcss"></style>
