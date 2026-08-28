<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/autocompleteVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/autocomplete.css'

import { useInputTextCore } from './.composables/useInputTextCore.js'
import useValidateEvents from './.composables/useValidateEvents.js'
import { useDropdownCore } from './.composables/useDropdownCore.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['change', 'input', 'update:modelValue'])
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => {},
  },
  rules: {
    type: [String, Object],
    default: null,
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})

const isComposing = ref(false)
const isSelectingOption = ref(false)
const label = ref(null)
const selectedIndex = ref(-1)
const dropdownItems = ref(null)
const inputOptions = ref(null)
const inputWaitRafId = ref(null)
const inputWaitToken = ref(0)
const isWaiting = ref(false)

const instance = getCurrentInstance()
const hasInputListener = computed(() => !!instance?.vnode?.props?.onInput)

const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})

const defaultConfig = {
  placeholder: '',
  // 驗證時機。null = 沿用全域(等同 ['blur', 'change', 'modelUpdate']);
  // 傳陣列為「完整指定」,詳見 .composables/useValidateEvents.js
  validateEvents: null,
  noMatchClearLabel: false,
  waitMessage: '資料讀取中',
  noResult: '無任何選項。',
  isDisabled: false,
  isExistClose: true,
  isError: false,
  position: 'auto',
  input: {
    wait: 0,
    minChars: 0,
  },
  schema: {
    label: 'label',
    value: 'value',
    model: 'label',
  },
  keyboard: false,
  maxItems: 5,
}
const defaultSetClass = {
  main: '',
  container: '',
  element: '',
  type: '',
  error: '',
  dropdown: '',
  dropdownContainer: '',
  dropdownLabel: '',
}
const { config, setClass } = useInputTextCore(props, {
  defaultConfig,
  defaultSetClass,
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const resolvedOptions = computed(() => {
  if (Array.isArray(inputOptions.value)) {
    return inputOptions.value
  }

  return Array.isArray(props.options) ? props.options : []
})

// dropdown 定位 / 開關 / 捲動關閉統一交給 useDropdownCore(與 Select 共用)
const {
  isFocus,
  isActive,
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  onSwitchActive,
  onCloseDropdown,
  onDropdownActive,
  onSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config,
  model,
  options: resolvedOptions,
  selectedIndex,
})

const isMinCharsReached = computed(() => {
  return (label.value?.trim()?.length || 0) >= config.value.input.minChars
})

const onSetInputOptions = (options) => {
  inputOptions.value = Array.isArray(options) ? options : []
  isWaiting.value = false
}

const cancelInputWait = () => {
  inputWaitToken.value++

  if (inputWaitRafId.value !== null) {
    cancelAnimationFrame(inputWaitRafId.value)
    inputWaitRafId.value = null
  }
}

const waitInputByRaf = (duration) => {
  cancelInputWait()

  const currentToken = inputWaitToken.value
  const wait = Number(duration) || 0

  if (wait <= 0) return Promise.resolve(true)

  return new Promise((resolve) => {
    let startTime = null

    const step = (timestamp) => {
      if (currentToken !== inputWaitToken.value) {
        resolve(false)
        return
      }

      if (startTime === null) {
        startTime = timestamp
      }

      if (timestamp - startTime >= wait) {
        inputWaitRafId.value = null
        resolve(true)
        return
      }

      inputWaitRafId.value = requestAnimationFrame(step)
    }

    inputWaitRafId.value = requestAnimationFrame(step)
  })
}

const emitInput = () => {
  if (hasInputListener.value) {
    isWaiting.value = true
  }

  emits('input', label.value, onSetInputOptions)
}

const emitInputWithWait = async () => {
  const { input } = config.value

  if (!isMinCharsReached.value) {
    cancelInputWait()
    inputOptions.value = null
    isWaiting.value = false
    return
  }

  const canContinue = await waitInputByRaf(input.wait)

  if (!canContinue) return

  if (!isMinCharsReached.value) {
    inputOptions.value = null
    isWaiting.value = false
    return
  }

  emitInput()
}

const onFilter = () => {
  const { schema } = config.value
  const sourceOptions = resolvedOptions.value

  const escapeRegExp = () => (label.value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = label.value ? new RegExp(escapeRegExp()) : null
  const matches = regex
    ? sourceOptions.filter((item) => regex.test(item[schema.label]))
    : sourceOptions

  dropdownItems.value = matches
}

const onGetInputLabel = () => {
  const hasModel = model.value !== null && model.value !== ''

  if (!hasModel) {
    return
  }

  const { schema } = config.value
  const matchData = resolvedOptions.value.find((item) => item[schema.model] == model.value)

  label.value = matchData ? matchData[schema.label] : model.value
}

const onResetDropdownItems = () => {
  const sourceOptions = resolvedOptions.value
  dropdownItems.value = sourceOptions.length !== 0 ? sourceOptions : null
}

const onIsComposingChange = (boolean) => {
  isComposing.value = boolean
}

const onFocus = async () => {
  onResetDropdownItems()

  await onDropdownActive()
}

const onInput = async () => {
  if (isComposing.value) return

  model.value = label.value

  await emitInputWithWait()

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await onDropdownActive()
}

const onCompositionEnd = async () => {
  onIsComposingChange(false)

  model.value = label.value

  await emitInputWithWait()

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await onDropdownActive()
}

const onBlur = () => {
  cancelInputWait()

  if (isSelectingOption.value || isComposing.value) return

  const { noMatchClearLabel, schema } = config.value

  if (!noMatchClearLabel) return

  const sourceOptions = resolvedOptions.value

  const hasMatch = label.value
    ? !!sourceOptions.find((item) => item[schema.label] === label.value)
    : false

  if (!hasMatch) {
    label.value = ''
  }
}

const onDropdownItemClick = (item) => {
  const { schema } = config.value
  model.value = item[schema.model]
  label.value = item[schema.label]
  isSelectingOption.value = false

  onSwitchActive(false)
  emitInput()
  emits('change', item)
}

const onDropdownItemMousedown = () => {
  isSelectingOption.value = true
}

const onClear = () => {
  cancelInputWait()
  model.value = ''
  label.value = null
  inputOptions.value = null
  selectedIndex.value = -1
  dropdownItems.value = null
  emitInput()
  isWaiting.value = false
  emits('change', null)
}

const onInit = () => {
  onFilter()
}

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

watch(
  () => props.modelValue,
  () => {
    const hasModel = props.modelValue !== null && props.modelValue !== ''

    if (!hasModel) {
      label.value = null
      return
    }

    onGetInputLabel()
  }
)

watch(
  () => props.options,
  () => {
    onGetInputLabel()
    onFilter()
  },
  { deep: true }
)

watch(
  inputOptions,
  async () => {
    onFilter()

    if (!isActive.value || !isMinCharsReached.value) return

    await onDropdownActive()
  },
  { deep: true }
)

onMounted(() => {
  onGetInputLabel()
  onInit()

  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  cancelInputWait()
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      :rules="props.rules"
      v-model="model"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" v-bind="field" />
      <div class="m-form-container" :class="setClass.container">
        <div
          class="m-form-element --autocomplete"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
          ref="elenemtRef"
        >
          <input
            :name="`${props.name}_type`"
            type="text"
            v-model="label"
            class="m-form-type"
            autocomplete="off"
            :placeholder="config.placeholder"
            :disabled="config.isDisabled"
            @focus="onFocus"
            @input="onInput"
            @blur="onBlur"
            @compositionstart="onIsComposingChange(true)"
            @compositionend="onCompositionEnd"
          />
          <button
            type="button"
            class="m-form-clear-button"
            :class="{
              '--show': label,
            }"
            tabindex="-1"
            @click="onClear"
            v-if="config.isExistClose && !config.isDisabled"
          >
            <CommonSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
          </button>
          <CommonSvgIcon icon="icon_search" class="m-form-autocomplete-icon" />
        </div>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      class="m-form-autocomplete-error"
      :class="setClass.error"
      :name="props.name"
      v-slot="{ message }"
    >
      <CommonMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="autocomplete" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-form-autocomplete-dropdown"
        :class="setClass.dropdown"
        ref="dropdownRef"
        v-if="isActive && dropdownItems && !config.isDisabled"
      >
        <div
          class="m-form-autocomplete-dropdown-container"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <div class="m-form-autocomplete-dropdown-no-data" v-if="dropdownItems.length === 0">
            <p>{{ isWaiting ? config.waitMessage : config.noResult }}</p>
          </div>
          <ul class="m-form-autocomplete-dropdown-body scrollbar --y" v-else>
            <li
              class="m-form-autocomplete-dropdown-item"
              v-for="(item, index) in dropdownItems"
              :key="`${item}_${index}`"
              ref="dropdownItemRef"
            >
              <button
                type="button"
                class="m-form-autocomplete-dropdown-button"
                :class="{
                  '--active': index === selectedIndex,
                }"
                @mousedown="onDropdownItemMousedown"
                @click="onDropdownItemClick(item)"
              >
                <em class="m-form-autocomplete-dropdown-label" :class="setClass.dropdownLabel">
                  <slot name="option" :item="item">
                    {{ item[config.schema.label] }}
                  </slot>
                </em>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

