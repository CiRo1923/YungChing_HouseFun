<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/autocompleteVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/autocomplete.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'

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

const elenemtRef = ref(null)
const dropdownRef = ref(null)
const dropdownNoDataRef = ref(null)
const dropdownContainerRef = ref(null)
const dropdownItemRef = ref(null)
const isActive = ref(false)
const isFocus = ref(false)
const isComposing = ref(false)
const isSelectingOption = ref(false)
const inputLabel = ref(null)
const selected = ref({
  index: null,
})
const dropdownItems = ref(null)
const inputOptions = ref(null)
const inputWaitRafId = ref(null)
const inputWaitToken = ref(0)
// 等待外部把選項餵回來的期間顯示 waitMessage,而不是先閃一下「無任何選項」
const isWaiting = ref(false)
// 只有掛了 @input 的呼叫端才會有人回填選項;沒掛就不該進入等待狀態(會永遠等下去)
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

const config = computed(() => {
  const defaultConfig = {
    placeholder: '',
    // 驗證時機。null = 沿用全域(等同 ['blur', 'change', 'modelUpdate']);
    // 傳陣列為「完整指定」,詳見 common/mForm/.composables/useValidateEvents.js
    validateEvents: null,
    noMatchClearLabel: false,
    noResult: '無任何選項。',
    waitMessage: '資料讀取中',
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

  return onDeepMerge(defaultConfig, props.config)
})
const validateOn = useValidateEvents(() => config.value.validateEvents)

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
    },
    ...props.setClass,
  }
})

const resolvedOptions = computed(() => {
  if (Array.isArray(inputOptions.value)) {
    return inputOptions.value
  }

  return Array.isArray(props.options) ? props.options : []
})

const isMinCharsReached = computed(() => {
  return (inputLabel.value?.trim()?.length || 0) >= config.value.input.minChars
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

  emits('input', inputLabel.value, onSetInputOptions)
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

  const escapeRegExp = () => (inputLabel.value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = inputLabel.value ? new RegExp(escapeRegExp()) : null
  const matches = regex
    ? sourceOptions.filter((item) => regex.test(item[schema.label]))
    : sourceOptions

  dropdownItems.value = matches
}

const onSwitchActive = (value) => {
  isFocus.value = value !== undefined ? value : !isFocus.value
  isActive.value = value !== undefined ? value : !isActive.value
}

const onCloseDropdown = () => {
  onSwitchActive(false)
}

const onGetInputLabel = () => {
  const hasModel = model.value !== null && model.value !== ''

  if (!hasModel) {
    return
  }

  // model 存的是 schema.model 的值,不一定等於要顯示的文字 —— 兩者不同名時
  // (例:model 存 id、label 顯示名稱)直接拿 model 當顯示值會在輸入框看到 id。
  // 先回查 options 取對應的 label,查不到才退回 model 本身。
  const { schema } = config.value
  const matchData = resolvedOptions.value.find((item) => item[schema.model] == model.value)

  inputLabel.value = matchData ? matchData[schema.label] : model.value
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

  onSwitchActive(true)

  await nextTick()
  onDropdownOpen()
}

const onInput = async () => {
  if (isComposing.value) return

  // 邊打邊同步到 v-model:使用者可能自由輸入而不從清單選,少了這行時
  // 只有「點選項目」才會寫回 model,直接送出會拿到空值。
  model.value = inputLabel.value

  await emitInputWithWait()

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await nextTick()
  onDropdownOpen()
}

const onCompositionEnd = async () => {
  onIsComposingChange(false)

  // 同 onInput —— 注音/日文等組字結束才算真正輸入完成,這裡補一次同步
  model.value = inputLabel.value

  await emitInputWithWait()

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await nextTick()
  onDropdownOpen()
}

const onBlur = () => {
  cancelInputWait()

  if (isSelectingOption.value || isComposing.value) return

  const { noMatchClearLabel, schema } = config.value

  if (!noMatchClearLabel) return

  const sourceOptions = resolvedOptions.value

  const hasMatch = inputLabel.value
    ? !!sourceOptions.find((item) => item[schema.label] === inputLabel.value)
    : false

  if (!hasMatch) {
    inputLabel.value = ''
  }
}

const onDropdownOpen = () => {
  const { maxItems, isDisabled, schema, position } = config.value
  const $elenemt = elenemtRef.value
  const $dropdown = dropdownRef.value
  const $dropdownContainer = dropdownContainerRef.value
  const element = {
    rect: elenemtRef.value.getBoundingClientRect(),
  }
  const offsetTop = element.rect.height + element.rect.top + window.scrollY

  if ($elenemt && $dropdown) {
    if ($dropdownContainer) {
      const hasItemsThanMax = dropdownItemRef.value.length > maxItems

      if (hasItemsThanMax) {
        $dropdownContainer.style.overflowY = 'auto'
      }

      const index = hasItemsThanMax ? maxItems - 1 : dropdownItemRef.value.length - 1
      const $item = dropdownItemRef.value[index]
      const dropdown = {
        rect: dropdownRef.value.getBoundingClientRect(),
      }

      const itemHeight = $item
        ? hasItemsThanMax
          ? $item.offsetTop
          : $item.offsetTop + $item.offsetHeight
        : 0

      const offsetLeftMin = dropdown.rect.width + element.rect.left
      const dropdownWidth =
        dropdown.rect.width < element.rect.width ? element.rect.width : dropdown.rect.width
      const offsetLeftMax = element.rect.width + element.rect.left - dropdownWidth
      const bodyWidth = document.body.scrollWidth
      const left =
        ((offsetLeftMin > bodyWidth && offsetLeftMax < 0) || offsetLeftMin < bodyWidth) &&
        position !== 'right'
          ? element.rect.left
          : offsetLeftMax
      const maxHeight = itemHeight

      $dropdown.style.height = `${maxHeight}px`
      $dropdown.style.top = `${offsetTop}px`
      $dropdown.style.left = `${left}px`

      if (dropdown.rect.width < element.rect.width) {
        $dropdown.style.minWidth = `${element.rect.width}px`
      }

      if (model.value !== null && model.value !== '') {
        selected.value.index = resolvedOptions.value.findIndex(
          (item) => item[schema.model] === model.value
        )

        const $selectedItem = dropdownItemRef.value[selected.value.index]

        if ($selectedItem) {
          const selectedItem = {
            rect: $selectedItem.getBoundingClientRect(),
          }

          $dropdownContainer.scrollTop =
            $selectedItem.offsetTop + selectedItem.rect.height / 2 - maxHeight / 2
        }
      }
    } else if (!isDisabled) {
      $dropdown.style.height = `${dropdownNoDataRef.value.offsetHeight}px`
      $dropdown.style.top = `${offsetTop}px`
      $dropdown.style.left = `${element.rect.left}px`
      $dropdown.style.minWidth = `${element.rect.width}px`
    }
  }
}

const onDropdownItemClick = (item) => {
  const { schema } = config.value
  model.value = item[schema.model]
  inputLabel.value = item[schema.label]
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
  inputLabel.value = null
  inputOptions.value = null
  selected.value.index = null
  dropdownItems.value = null
  emitInput()
  // emitInput 會把 isWaiting 打開,但清空是使用者主動取消、不該卡在讀取中
  isWaiting.value = false
  emits('change', null)
}

const onInit = () => {
  onFilter()
}

const onOutSide = (e) => {
  const $elenemt = elenemtRef.value
  const $dropdown = dropdownRef.value
  const isElenemtContains = $elenemt ? !$elenemt.contains(e.target) : true
  const isDropdownContains = $dropdown ? !$dropdown.contains(e.target) : true
  const isOutSide = isElenemtContains && isDropdownContains

  if (isOutSide) {
    onSwitchActive(false)
  }
}

const onResize = () => {
  onDropdownOpen()
}

watch(
  () => props.modelValue,
  () => {
    const hasModel = props.modelValue !== null && props.modelValue !== ''

    if (!hasModel) {
      inputLabel.value = null
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

    // 非同步選項回來時清單長度變了,dropdown 的高度與位置是開啟當下算的 ——
    // 不重算的話會停在舊高度(選項變多被裁切、變少則留一段空白)。
    if (!isActive.value || !isMinCharsReached.value) return

    await nextTick()
    onDropdownOpen()
  },
  { deep: true }
)

onMounted(() => {
  onGetInputLabel()
  onInit()

  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelInputWait()
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <div class="m-form-container" :class="setClass.container">
      <Field
        :name="props.name"
        :rules="config.isDisabled ? '' : props.rules"
        v-model="model"
        v-bind="validateOn"
        v-slot="{ field, errorMessage }"
      >
        <input type="hidden" v-bind="field" />
        <div
          class="m-form-element --autocomplete"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
          ref="elenemtRef"
        >
          <input
            :name="`${props.name}_type`"
            type="text"
            v-model="inputLabel"
            class="m-form-type"
            :class="setClass.type"
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
              '--show': inputLabel,
            }"
            tabindex="-1"
            @click="onClear"
            v-if="config.isExistClose && !config.isDisabled"
          >
            <CommonSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
          </button>
          <CommonSvgIcon icon="icon_search" class="m-form-autocomplete-icon" />
        </div>
      </Field>
    </div>
    <ErrorMessage
      as="span"
      class="m-form-autocomplete-error"
      :class="setClass.error"
      :name="props.name"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem :message="message" />
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
          class="m-form-autocomplete-dropdown-no-data"
          v-if="dropdownItems.length === 0"
          ref="dropdownNoDataRef"
        >
          <p>{{ isWaiting ? config.waitMessage : config.noResult }}</p>
        </div>
        <ul
          class="m-form-autocomplete-dropdown-container"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
          v-else
        >
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
                '--active': index === selected.index,
              }"
              @mousedown="onDropdownItemMousedown"
              @click="onDropdownItemClick(item)"
            >
              <em class="m-form-autocomplete-dropdown-label">
                <slot name="option" :item="item">
                  {{ item[config.schema.label] }}
                </slot>
              </em>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>
