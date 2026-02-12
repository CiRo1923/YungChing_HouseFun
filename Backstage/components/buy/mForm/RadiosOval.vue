<script setup>
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  rules: {
    type: [String, Object],
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
const model = ref(null)
const config = computed(() => {
  return {
    isReadonly: false,
    isDisabled: false,
    isError: false,
    schema: {
      label: 'label',
      value: 'value',
    },
    ...props.config,
  }
})
const setClass = computed(() => {
  return {
    ...{
      main: '',
      radios: '',
      item: '',
      error: '',
    },
    ...props.setClass,
  }
})
</script>

<template>
  <div class="m-form --radios-oval overflow-hidden" :class="setClass.main">
    <ul
      class="m-form-radios inline-flex overflow-hidden tm:flex-wrap tm:gap-x-[8px] tm:gap-y-[12px] p:rounded-[5px] p:bg-[--gray-f2]"
      :class="setClass.radios"
    >
      <li
        class="m-form-container tm:h-[50px] tm:rounded-[5px] tm:bg-[--gray-f2] p:h-[35px]"
        :class="setClass.item"
        v-for="(item, index) in props.options"
        :key="`${item[config.schema.label]}_${index}`"
      >
        <label
          class="m-form-element flex h-full w-full cursor-pointer items-center justify-center transition-colors duration-300 tm:px-[5px] p:px-[12px]"
          :class="{
            '--checked': item[config.schema.value] === model,
          }"
        >
          <input
            type="radio"
            :name="props.name"
            class="m-form-type absolute left-[-99999px]"
            :value="item[config.schema.value]"
            v-model="model"
          />
          <em>{{ item[config.schema.label] }}</em>
        </label>
      </li>
    </ul>
    <Field :name="`${props.name}_radios`" v-model="model" :rules="props.rules">
      <input type="hidden" :name="`${props.name}_radios`" :id="`${props.name}_radios`" />
    </Field>
    <ErrorMessage
      as="span"
      :name="`${props.name}_radios`"
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <ErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss">
.m-form {
  &.\-\-radios-oval {
    .m-form-element {
      &:not(&.\-\-checked) {
        @apply bg-transparent;
      }

      &.\-\-checked {
        @apply bg-[--orange-feea];
      }
    }
  }
}
</style>
