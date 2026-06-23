<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },
  options: {
    type: [Array, Object],
    default: null,
  },
  config: {
    type: Object,
    default: () => {},
  },
  rules: {
    type: Object,
    default: null,
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})
const selectRef = ref(null)
const selectedIndex = ref(-1)
const label = ref(null)
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    let result = value

    if (props.cityModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:modelValue', result)
  },
})
const config = computed(() => {
  const defaultConfig = {
    startOption: null,
    placeholder: null,
    isError: false,
    // dropdownWidth: 'auto',
    schema: {
      label: 'label',
      value: 'value',
    },
    keyboard: false,
    maxItems: 5,
  }

  return onMergeDropdownConfig(props.config, defaultConfig)
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      suffix: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
      dropdownBody: '',
    },
    ...props.setClass,
  }
})

const placeholder = computed(() => {
  const { placeholder } = config.value
  const isObject = placeholder && typeof placeholder !== 'string'

  return isObject
    ? placeholder
    : {
        value: placeholder,
        isToOption: false,
      }
})

const options = computed(() => {
  const { schema } = config.value
  const { value, isToOption } = placeholder.value
  const options = props.options ? onDeepClone(props.options) : []
  const placeholderItem = emptyData(onDeepClone(options[0]))

  if (isToOption) {
    placeholderItem[schema.label] = value
    placeholderItem[schema.value] = ''

    options.unshift(placeholderItem)
  }

  return options
})

const onSetSelectedIndex = () => {
  const { startOption } = config.value
  let index = -1

  if (options.value) {
    if (startOption) {
      // item.value == startOption 用 == 會有形態別問題 '1' (string) !== 1 (int)
      index = options.value.findIndex((item) => item.value == startOption)
    } else {
      // item[config.value.schema.value] == model.value 用 == 會有形態別問題 '1' (string) !== 1 (int)
      index = options.value.findIndex((item) => item[config.value.schema.value] == model.value)
    }

    // index = index === -1 ? 0 : index
    label.value = index !== -1 ? options.value[index][config.value.schema.label] : null
  }

  selectedIndex.value = index
}

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownBodyRef,
  dropdownItemRef,
  isFocus,
  isActive,
  isOpen,
  onSwitchActive,
  onCloseDropdown,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config,
  model,
  options,
  selectedIndex,
})

const onDropdownArrow = (e) => {
  const { code } = e

  e.preventDefault()

  if (config.value.keyboard && options.value.length > 0) {
    selectedIndex.value = code === 'ArrowDown' ? ++selectedIndex.value : --selectedIndex.value

    if (selectedIndex.value >= options.value.length) {
      selectedIndex.value = selectedIndex.value % options.value.length
    } else if (selectedIndex.value < 0) {
      selectedIndex.value = options.value.length - 1
    }

    const $dropdown = dropdownBodyRef.value
    const $dropdownItemRef = dropdownItemRef.value[selectedIndex.value]
    if (!$dropdown || !$dropdownItemRef) return

    const dropdown = {
      rect: $dropdown.getBoundingClientRect(),
    }
    const dropdownItem = {
      rect: $dropdownItemRef.getBoundingClientRect(),
    }

    if (selectedIndex.value !== 0 && selectedIndex.value !== options.value.length - 1) {
      if (code === 'ArrowDown') {
        if ($dropdown.scrollTop + dropdown.rect.height <= $dropdownItemRef.offsetTop) {
          $dropdown.scrollTop = $dropdown.scrollTop + dropdownItem.rect.height
        }
      } else {
        if ($dropdown.scrollTop > $dropdownItemRef.offsetTop) {
          $dropdown.scrollTop = $dropdown.scrollTop - dropdownItem.rect.height
        }
      }
    } else {
      if (selectedIndex.value === 0) {
        $dropdown.scrollTop = 0
      } else {
        $dropdown.scrollTop =
          (options.value.length - config.value.maxItems) * dropdownItem.rect.height
      }
    }
    const result = options.value[selectedIndex.value]
    model.value = result[config.value.schema.value]
    label.value = result[config.value.schema.label]

    // emits('change', result)
  }
}

const onDropdownEnter = () => {
  const $selectRef = selectRef.value

  onSwitchActive(false)
  $selectRef.blur()
}

const onDropdownItemClick = (index) => {
  const { schema } = config.value
  const option = options.value[index]

  selectedIndex.value = index
  model.value = option[schema.value]
  label.value = option[schema.label]

  onSwitchActive(false)
  emits('change', option)
}

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

watch(
  () => model.value,
  () => {
    onSetSelectedIndex()
  }
)

watch(
  () => options.value,
  () => {
    onSetSelectedIndex()
  },
  {
    deep: true,
  }
)

onMounted(() => {
  onSetSelectedIndex()
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})
</script>

<template>
  <div class="m-form" :class="setClass.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
      <div class="m-form-container flex" :class="setClass.container">
        <button
          type="button"
          class="m-form-element --select"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          :disabled="config.isDisabled"
          ref="elenemtRef"
          @click="onElementClick()"
          @keydown.up="onDropdownArrow($event)"
          @keydown.down="onDropdownArrow($event)"
          @keypress.enter="onDropdownEnter"
        >
          <div
            class="m-form-type"
            :class="[
              setClass.type,
              {
                '--placeholder': !label || !model,
              },
            ]"
            ref="selectRef"
          >
            <template v-if="label">
              {{ label }}
            </template>
            <template v-else-if="!label && placeholder.value">
              {{ placeholder.value }}
            </template>
          </div>
          <CommonSvgIcon
            icon="caret_large_down"
            class="m-form-icon"
            :class="setClass.icon"
            v-if="config.arrowType === 'caret'"
          />
          <!-- <i
            class="m-form-icon-arrow h-[16px] w-[16px] shrink-0"
            v-if="config.arrowType === 'arrow'"
          /> -->
        </button>
        <small class="m-form-suffix" :class="setClass.suffix" v-if="$slots.suffix">
          <slot name="suffix" />
        </small>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
      v-slot="{ message }"
    >
      <BuyMErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="dropdown" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-select-dropdown"
        :class="[setClass.dropdown, { '--open': isOpen }]"
        ref="dropdownRef"
        v-if="isActive && options && options.length !== 0 && !config.isDisabled"
      >
        <div
          class="m-select-dropdown-container"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <ul class="m-select-dropdown-body" :class="setClass.dropdownBody" ref="dropdownBodyRef">
            <li
              class="m-select-dropdown-item"
              v-for="(item, index) in options"
              :key="`${item}_${index}`"
              ref="dropdownItemRef"
            >
              <button
                type="button"
                class="m-select-dropdown-button block w-full px-[8px] text-left transition-colors duration-300"
                :class="{
                  '--active': index === selectedIndex,
                }"
                :disabled="item[config.schema.isDisabled] === true"
                @click="onDropdownItemClick(index)"
              >
                <em class="m-select-dropdown-label relative block grow py-[8px] text-[14px]">
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

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormSelect.css"></style>
<style lang="postcss">
.m-select-dropdown-button {
  &:not(:disabled) {
    /* @apply text-[--gray-333]; */

    /* &:not(.\-\-active) {
    } */

    &.\-\-active {
      @apply bg-[--orange-feea];
    }
  }

  &:disabled {
    @apply text-[--gray-3334d];
  }
}

.m-select-dropdown-item {
  &:not(:last-child) {
    .m-select-dropdown-button {
      &:after {
        @apply block h-[1px] w-full bg-[--gray-e5] opacity-30 content-default;
      }
    }
  }
}
</style>
