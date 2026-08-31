<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/searchVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/search.css'

import { useTextCore } from './.composables/useTextCore.js'

const emits = defineEmits(['update:modelValue', 'input', 'keydown.enter', 'enter'])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'text',
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const {
  model,
  config,
  setClass,
  onInput,
  onEnter: onTextEnter,
  onClear,
} = useTextCore({
  props,
  emits,
  config: {
    isEnterSearch: true,
  },
})

const isFocus = ref(false)

const onEnter = (e) => {
  if (!config.value.isEnterSearch) return

  onTextEnter(e)
  emits('enter', e)
}

const onFocus = (value) => {
  isFocus.value = value
}
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <div class="m-form-container" :class="setClass.container">
      <div class="m-form-element --search" :class="[setClass.element, { '--focus': isFocus }]">
        <input
          :id="props.name"
          :type="props.type"
          :value="model"
          class="m-form-type"
          :class="setClass.type"
          :placeholder="config.placeholder"
          autocomplete="off"
          @focusin="onFocus(true)"
          @blur="onFocus(false)"
          @input="onInput($event)"
          @keydown.enter="onEnter($event)"
        />
        <button
          v-if="config.hasClearButton"
          type="button"
          class="m-form-clear-button"
          :class="{
            '--show': model,
          }"
          tabindex="-1"
          @click="onClear"
        >
          <CommonSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
        </button>
        <CommonSvgIcon
          icon="icon_search"
          class="m-form-search-icon"
        />
      </div>
    </div>
  </div>
</template>

