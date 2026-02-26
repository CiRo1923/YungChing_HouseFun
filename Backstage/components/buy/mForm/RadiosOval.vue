<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

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
const setClass = computed(() => {
  return {
    ...{
      main: '',
      radios: '',
      container: '',
      element: '',
      type: '',
      error: '',
    },
    ...props.setClass,
  }
})
const onSelected = () => {
  const { schema } = config.value
  const isModelData = typeof model.value === 'object'

  selected.value =
    model.value !== undefined ? (isModelData ? model.value[schema.value] : model.value) : ''
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
  <div class="m-form --radios-oval overflow-hidden" :class="setClass.main">
    <ul
      class="m-form-radios inline-flex overflow-hidden tm:flex-wrap tm:gap-x-[9px] tm:gap-y-[12px] p:rounded-[5px] p:bg-[--gray-f2]"
      :class="setClass.radios"
    >
      <li
        class="m-form-container overflow-hidden tm:h-[50px] tm:rounded-[5px] tm:bg-[--gray-f2] p:h-[35px]"
        :class="setClass.container"
        v-for="(item, index) in props.options"
        :key="`${item[config.schema.label]}_${index}`"
      >
        <label
          class="m-form-element relative flex h-full w-full cursor-pointer items-center justify-center text-[--gray-666] transition-colors duration-300 tm:gap-x-[3px] tm:px-[10px] p:gap-x-[5px] p:px-[12px]"
          :class="[
            {
              '--checked': item[config.schema.value] === selected,
            },
            setClass.element,
          ]"
        >
          <input
            type="radio"
            :name="props.name"
            v-model="selected"
            :value="item[config.schema.value]"
            class="m-form-type sr-only"
            :class="setClass.type"
            @change="onChange(item)"
          />
          <SvgIcon
            icon="icon_check_solid"
            class="m-form-icon h-[16px] w-[16px] text-[--orange-e646]"
            v-if="item[config.schema.value] === selected"
          />
          <em class="m-form-label text-[16px]">{{ item[config.schema.label] }}</em>
        </label>
      </li>
    </ul>
    <Field
      :name="`${props.name}_radios`"
      v-model="selected"
      :rules="props.rules"
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

        .m-form-label {
          @apply font-semibold;
        }
      }
    }
  }
}

@screen p {
  .m-form {
    &.\-\-radios-oval {
      .m-form-element {
        &:not(&.\-\-checked) {
          @apply px-[25px];
        }
      }
    }
  }
}

@screen tm {
  .m-form {
    &.\-\-radios-oval {
      .m-form-element {
        &:not(&.\-\-checked) {
          @apply pl-[19px] pr-[20px];
        }
      }
    }
  }
}
</style>
