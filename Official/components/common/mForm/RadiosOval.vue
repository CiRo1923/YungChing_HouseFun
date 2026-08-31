<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/radiosOvalVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/radiosOval.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Boolean, Array],
    default: null,
  },
  rules: {
    type: Object,
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})
const selected = ref(null)
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})
const config = computed(() => {
  return {
    // 驗證時機。勾選類控制項刻意不吃 blur —— 用鍵盤 Tab 經過卻還沒選就跳紅字,
    // 那是誤報。change 已涵蓋「使用者動了它」,submit 的主動 validate() 一律會驗、
    // 不受此設定影響。詳見 .composables/useValidateEvents.js
    validateEvents: ['change'],
    modelMode: 'value',
    // isReadonly: false,
    // isDisabled: false,
    // isError: false,
    schema: {
      label: 'label',
      value: 'value',
    },
    ...props.config,
  }
})
const validateOn = useValidateEvents(() => config.value.validateEvents)
const setClass = computed(() => {
  return {
    ...{
      main: '',
      radios: '',
      container: '',
      element: '',
      type: '',
      label: '',
      error: '',
    },
    ...props.setClass,
  }
})
const onSelected = () => {
  const { schema } = config.value
  const isModelData = typeof model.value === 'object'

  selected.value =
    model.value != null // != 同時包含 undefined 和 null
      ? isModelData
        ? model.value[schema.value]
        : model.value
      : ''
}

const onChange = (item) => {
  const { modelMode, schema } = config.value
  const isModelModeData = modelMode === 'data'

  model.value = isModelModeData ? item : item[schema.value]
  emits('change', item)
}

onSelected()
</script>

<template>
  <div class="m-form --radios-oval" :class="setClass.main">
    <ul class="m-form-radios" :class="setClass.radios">
      <li
        class="m-form-container"
        :class="setClass.container"
        v-for="(item, index) in props.options"
        :key="`${item[config.schema.label]}_${index}`"
      >
        <!-- '--checked': item[config.schema.value] == selected 用 == 會有形態別問題 '1' (string) !== 1 (int) -->
        <label
          class="m-form-element"
          :class="[
            {
              '--checked': item[config.schema.value] == selected,
            },
            setClass.element,
          ]"
        >
          <input
            type="radio"
            :name="props.name"
            v-model="selected"
            :value="item[config.schema.value]"
            class="m-form-type"
            :class="setClass.type"
            @change="onChange(item)"
          />
          <!-- v-if="item[config.schema.value] == selected" 用 == 會有形態別問題 '1' (string) !== 1 (int) -->
          <CommonSvgIcon
            icon="icon_check_solid"
            class="m-form-icon"
            v-if="item[config.schema.value] == selected"
          />
          <em class="m-form-label" :class="setClass.label">{{ item[config.schema.label] }}</em>
        </label>
      </li>
    </ul>
    <Field
      :name="`${props.name}_radios`"
      v-model="selected"
      :rules="props.rules"
      v-bind="validateOn"
      v-slot="{ field }"
    >
      <input type="hidden" :id="`${props.name}_radios`" v-bind="field" />
    </Field>
    <ErrorMessage
      as="span"
      :name="`${props.name}_radios`"
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <CommonMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>
