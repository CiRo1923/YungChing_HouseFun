<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { deepMerge } from '@js/_prototype.js'

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['change', 'search', 'update:modelValue'])
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
const inputLabel = ref(null)
const selected = ref({
  index: null,
})
const dropdownItems = ref(null)
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
    noMatchClearLabel: true,
    noResult: '無任何選項。',
    isDisabled: false,
    isExistClose: true,
    isError: false,
    position: 'auto',
    schema: {
      label: 'label',
      value: 'value',
    },
    keyboard: false,
    maxItems: 5,
  }

  return deepMerge(defaultConfig, props.config)
})

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

const onFilter = () => {
  const { schema } = config.value
  const { label } = schema
  const escapeRegExp = () => inputLabel.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = inputLabel.value ? new RegExp(escapeRegExp()) : null
  const matches = regex ? props.options.filter((item) => regex.test(item[label])) : props.options

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
  const matchData = hasModel
    ? props.options.find((item) => item[config.value.schema.value] === model.value)
    : null

  inputLabel.value = matchData ? matchData[config.value.schema.label] : ''
}

const onResetDropdownItems = () => {
  dropdownItems.value = props.options.length !== 0 ? props.options : null
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
  onFilter()
  await nextTick()
  onDropdownOpen()
}

const onCompositionEnd = async () => {
  onIsComposingChange(false)
  onFilter()
  await nextTick()
  onDropdownOpen()
}

// const onKeyup = async () => {
//   onFilter()

//   await nextTick()
//   onDropdownOpen()
// }

const onBlur = () => {
  const { noMatchClearLabel } = config.value
  const hasMatch = inputLabel.value
    ? !!props.options.find((item) => item[config.value.schema.label] === inputLabel.value)
    : false
  const matchData = props.options.find((item) => item[config.value.schema.value] === model.value)
  const label = model.value && matchData ? matchData[config.value.schema.label] : ''

  if (noMatchClearLabel && !hasMatch) {
    inputLabel.value = label
  }
}

// const onChanged = (e) => {
//   if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown') {
//     if (e.code !== 'Enter' && e.code !== 'NumpadEnter') {
//       model.value = ''
//       selectedIndex.value = 0
//       onSwitchActive(true)
//     }
//   }
// }

// const onArrow = (e) => {
//   const { code } = e
//   const datas = data.value.filter((item) => item.isHidden === false)
//   let index = datas.findIndex((item) => item.index === selectedIndex.value)

//   e.preventDefault()

//   if (datas.length > 0) {
//     index = code === 'ArrowDown' ? ++index : --index

//     if (index >= datas.length) {
//       index = index % datas.length
//     } else if (index < 0) {
//       index = datas.length - 1
//     }

//     selectedIndex.value = datas[index].index

//     const $dropdownRef = dropdownRef.value
//     const containerHeight = $dropdownRef.offsetHeight - borderWidth * 2
//     const $itemRef = itemRef.value[selectedIndex.value]
//     const itemHeight = $itemRef.offsetHeight

//     if (
//       selectedIndex.value !== 0 &&
//       selectedIndex.value !== data.value.length - 1
//     ) {
//       if (code === 'ArrowDown') {
//         if ($dropdownRef.scrollTop + containerHeight <= $itemRef.offsetTop) {
//           $dropdownRef.scrollTop = $dropdownRef.scrollTop + itemHeight
//         }
//       } else {
//         if ($dropdownRef.scrollTop > $itemRef.offsetTop) {
//           $dropdownRef.scrollTop = $dropdownRef.scrollTop - itemHeight
//         }
//       }
//     } else {
//       if (selectedIndex.value === 0) {
//         $dropdownRef.scrollTop = 0
//       } else {
//         $dropdownRef.scrollTop =
//           (data.value.length - props.maxItems) * itemHeight
//       }
//     }

//     model.value = data.value[selectedIndex.value][config.value.schema.value]
//   }
// }

const onDropdownOpen = () => {
  const { maxItems, isDisabled } = config.value
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
        config.value.position !== 'right'
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
        selected.value.index = props.options.findIndex(
          (item) => item[config.value.schema.value] === model.value
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

// const onClear = () => {
//   onReset()
//   onSwitchActive(false)
//   emits('click', '')
// }

// const onEnter = () => {
//   // const index = props.data.findIndex(
//   //   (item) => item[config.value.schema.value] === model.value
//   // )

//   // console.log(selectedIndex.value)

//   const result = data.value[selectedIndex.value]

//   if (result) {
//     label.value = result[config.value.schema.label]
//     model.value = result[config.value.schema.value]

//     if (result[config.value.schema.value]) {
//       onSwitchActive(false)
//     }
//     emits('click', result)
//   }
// }

const onDropdownItemClick = (item) => {
  model.value = item[config.value.schema.value]
  inputLabel.value = item[config.value.schema.label]

  onSwitchActive(false)
  emits('change', item)
}

const onClear = () => {
  model.value = ''
  inputLabel.value = null
  selected.value.index = null
}

watch(
  () => props.modelValue,
  (value) => {
    onGetInputLabel()
  }
)

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
  // device.value = onDevice()
  onDropdownOpen()
}

onMounted(() => {
  // onSetSelectedIndex()
  onGetInputLabel()
  onFilter()
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
})

// defineExpose({
//   onReset,
// })
</script>

<template>
  <div class="m-autocomplete" :class="setClass.main">
    <div class="m-autocomplete-container overflow-hidden" :class="setClass.container">
      <Field
        :name="props.name"
        :rules="props.rules"
        v-model="model"
        v-slot="{ field, errorMessage }"
      >
        <input type="hidden" v-bind="field" />
        <div
          class="m-autocomplete-element jFormValid relative flex items-center gap-x-[8px] rounded-[5px] border-[1px] border-[--autocomplete-border-color] bg-[--autocomplete-bg-color] px-[10px] transition-colors duration-300"
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
            class="m-autocomplete-type min-w-0 grow"
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
            class="m-autocomplete-clear-button flex h-[18px] w-[18px] shrink-0 items-center p-[4px] text-[--gray-999] transition-opacitys duration-300"
            :class="{
              '--show': inputLabel,
            }"
            @click="onClear"
            v-if="config.isExistClose && !config.isDisabled"
          >
            <SvgIcon icon="icon_xmark" class="m-autocomplete-clear-icon" />
          </button>
          <SvgIcon
            icon="icon_search"
            class="pointer-events-none h-[18px] w-[18px] shrink-0 text-[--autocomplete-icon-color] transition-colors duration-300"
          />
          <!-- @keydown.up="onArrow($event)" -->
          <!-- @keydown.down="onArrow($event)" -->
          <!-- @keypress.enter="onEnter" -->
        </div>
      </Field>
    </div>
    <ErrorMessage
      as="span"
      class="m-autocomplete-error"
      :class="setClass.error"
      :name="props.name"
      v-slot="{ message }"
    >
      <ErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="autocomplete" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-autocomplete-dropdown absolute z-[5] mt-[3px] overflow-hidden"
        :class="setClass.dropdown"
        ref="dropdownRef"
        v-if="isActive && dropdownItems && !config.isDisabled"
      >
        <div
          class="m-autocomplete-dropdown-no-data bg-[--white] p-[8px] text-[14px] text-[--gray-333]"
          v-if="dropdownItems.length === 0"
          ref="dropdownNoDataRef"
        >
          <p>{{ config.noResult }}</p>
        </div>
        <ul
          class="m-autocomplete-dropdown-container max-h-full bg-[--white]"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
          v-else
        >
          <li
            class="m-autocomplete-dropdown-item"
            v-for="(item, index) in dropdownItems"
            :key="`${item}_${index}`"
            ref="dropdownItemRef"
          >
            <button
              type="button"
              class="m-autocomplete-dropdown-button block w-full px-[8px] text-left transition-colors duration-300"
              :class="{
                '--active': index === selected.index,
              }"
              @click="onDropdownItemClick(item)"
            >
              <em class="m-autocomplete-dropdown-label relative block grow py-[8px] text-[14px]">
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

<style src="@css/_common/vueTransition.css"></style>
<style lang="postcss">
.m-autocomplete-element {
  &.\-\-disabled {
    --autocomplete-bg-color: var(--gray-f2);

    &,
    .m-autocomplete-type {
      @apply cursor-not-allowed;
    }
  }

  &:not(.\-\-disabled) {
    --autocomplete-bg-color: var(--modules-bgColor);
    --autocomplete-text-color: var(--textColor-title);

    .m-autocomplete-type {
      @apply text-[--gray-666];

      &::placeholder {
        @apply text-[--gray-999];
      }
    }

    /* &.\-\-focus {
      --autocomplete-border-color: var(--color-blue-major);
    } */
  }

  &:not(.\-\-error) {
    --autocomplete-icon-color: var(--gray-ccce);
    --autocomplete-border-color: var(--gray-e5);
  }

  /* &:not(.\-\-required):not(.\-\-focus):not(.\-\-error) {
    @apply delay-150;
  }

  &.\-\-required {
    @apply border-[--gray-4448];
  }

  &.\-\-focus {
    @apply border-[--red-b12b];
  }

  &.\-\-error {
    @apply border-[--red-f00] bg-[rgba(var(--red-f235-rgb),0.05)];
  } */
}

.m-autocomplete-clear-button {
  &:not(.\-\-show) {
    @apply pointer-events-none invisible opacity-0;
  }

  &.\-\-show {
    @apply visible opacity-100;
  }
}

.m-autocomplete-error {
  @apply mt-[2px] flex text-left text-[--red-f00];
}

.m-autocomplete-dropdown {
  box-shadow:
    0 4px 24px 0 #02041614,
    0 2px 16px -8px #02041633;
}

.m-autocomplete-dropdown-item {
  &:not(:last-child) {
    .m-autocomplete-dropdown-button {
      &:after {
        @apply block h-[1px] w-full bg-[--gray-e5] opacity-30 content-default;
      }
    }
  }
}

.m-autocomplete-dropdown-button {
  &:not(:disabled) {
    @apply text-[--gray-333];

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

@screen p {
  .m-autocomplete {
    &.\-\-px-12,
    &.p\:\-\-px-12,
    &.pt\:\-\-px-12 {
      .m-autocomplete-element {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-16,
    &.p\:\-\-padding-y-16,
    &.pt\:\-\-padding-y-16 {
      .m-autocomplete-element {
        @apply py-[16px];
      }
    }

    &.\-\-h-40,
    &.p\:\-\-h-40,
    &.pt\:\-\-h-40 {
      .m-autocomplete-element {
        @apply h-[40px];
      }
    }

    &.\-\-text-18,
    &.p\:\-\-text-18,
    &.pt\:\-\-text-18 {
      .m-autocomplete-type {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.p\:\-\-text-16,
    &.pt\:\-\-text-16 {
      .m-autocomplete-type {
        @apply text-[16px];
      }
    }
  }

  .m-autocomplete-dropdown {
    &.\-\-rounded-16,
    &.p\:\-\-rounded-16,
    &.pt\:\-\-rounded-16 {
      @apply rounded-[16px];
    }

    &.\-\-padding-12,
    &.p\:\-\-padding-12,
    &.pt\:\-\-padding-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[12px];
      }
    }

    &.\-\-padding-x-12,
    &.p\:\-\-padding-x-12,
    &.pt\:\-\-padding-x-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-12,
    &.p\:\-\-padding-y-12,
    &.pt\:\-\-padding-y-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[12px];
      }
    }

    &.\-\-padding-24,
    &.p\:\-\-padding-24,
    &.pt\:\-\-padding-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[24px];
      }
    }

    &.\-\-padding-x-24,
    &.p\:\-\-padding-x-24,
    &.pt\:\-\-padding-x-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[24px];
      }
    }

    &.\-\-padding-y-24,
    &.p\:\-\-padding-y-24,
    &.pt\:\-\-padding-y-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[24px];
      }
    }

    &.\-\-text-18,
    &.p\:\-\-text-18,
    &.pt\:\-\-text-18 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.p\:\-\-text-16,
    &.pt\:\-\-text-16 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[16px];
      }
    }
  }
}

@screen t {
  .m-autocomplete {
    &.\-\-px-12,
    &.pt\:\-\-px-12,
    &.tm\:\-\-px-12,
    &.t\:\-\-px-12 {
      .m-autocomplete-element {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-16,
    &.pt\:\-\-padding-y-16,
    &.tm\:\-\-padding-y-16,
    &.t\:\-\-padding-y-16 {
      .m-autocomplete-element {
        @apply py-[16px];
      }
    }

    &.\-\-h-40,
    &.pt\:\-\-h-40,
    &.tm\:\-\-h-40,
    &.t\:\-\-h-40 {
      .m-autocomplete-element {
        @apply h-[40px];
      }
    }

    &.\-\-text-18,
    &.pt\:\-\-text-18,
    &.tm\:\-\-text-18,
    &.t\:\-\-text-18 {
      .m-autocomplete-type {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.pt\:\-\-text-16,
    &.tm\:\-\-text-16,
    &.t\:\-\-text-16 {
      .m-autocomplete-type {
        @apply text-[16px];
      }
    }
  }

  .m-autocomplete-dropdown {
    &.\-\-rounded-16,
    &.pt\:\-\-rounded-16,
    &.tm\:\-\-rounded-16,
    &.t\:\-\-rounded-16 {
      @apply rounded-[16px];
    }

    &.\-\-padding-12,
    &.pt\:\-\-padding-12,
    &.tm\:\-\-padding-12,
    &.t\:\-\-padding-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[12px];
      }
    }

    &.\-\-padding-x-12,
    &.pt\:\-\-padding-x-12,
    &.tm\:\-\-padding-x-12,
    &.t\:\-\-padding-x-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-12,
    &.pt\:\-\-padding-y-12,
    &.tm\:\-\-padding-y-12,
    &.t\:\-\-padding-y-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[12px];
      }
    }

    &.\-\-padding-24,
    &.pt\:\-\-padding-24,
    &.tm\:\-\-padding-24,
    &.t\:\-\-padding-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[24px];
      }
    }

    &.\-\-padding-x-24,
    &.pt\:\-\-padding-x-24,
    &.tm\:\-\-padding-x-24,
    &.t\:\-\-padding-x-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[24px];
      }
    }

    &.\-\-padding-y-24,
    &.pt\:\-\-padding-y-24,
    &.tm\:\-\-padding-y-24,
    &.t\:\-\-padding-y-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[24px];
      }
    }

    &.\-\-text-18,
    &.pt\:\-\-text-18,
    &.tm\:\-\-text-18,
    &.t\:\-\-text-18 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.pt\:\-\-text-16,
    &.tm\:\-\-text-16,
    &.t\:\-\-text-16 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[16px];
      }
    }
  }
}

@screen m {
  .m-autocomplete {
    &.\-\-px-12,
    &.tm\:\-\-px-12,
    &.m\:\-\-px-12 {
      .m-autocomplete-element {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-16,
    &.tm\:\-\-padding-y-16,
    &.m\:\-\-padding-y-16 {
      .m-autocomplete-element {
        @apply py-[16px];
      }
    }

    &.\-\-h-40,
    &.tm\:\-\-h-40,
    &.m\:\-\-h-40 {
      .m-autocomplete-element {
        @apply h-[40px];
      }
    }

    &.\-\-text-18,
    &.tm\:\-\-text-18,
    &.m\:\-\-text-18 {
      .m-autocomplete-type {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.tm\:\-\-text-16,
    &.m\:\-\-text-16 {
      .m-autocomplete-type {
        @apply text-[16px];
      }
    }
  }

  .m-autocomplete-dropdown {
    &.\-\-rounded-16,
    &.tm\:\-\-rounded-16,
    &.m\:\-\-rounded-16 {
      @apply rounded-[16px];
    }

    &.\-\-padding-12,
    &.tm\:\-\-padding-12,
    &.m\:\-\-padding-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[12px];
      }
    }

    &.\-\-padding-x-12,
    &.tm\:\-\-padding-x-12,
    &.m\:\-\-padding-x-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[12px];
      }
    }

    &.\-\-padding-y-12,
    &.tm\:\-\-padding-y-12,
    &.m\:\-\-padding-y-12 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[12px];
      }
    }

    &.\-\-padding-24,
    &.tm\:\-\-padding-24,
    &.m\:\-\-padding-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply p-[24px];
      }
    }

    &.\-\-padding-x-24,
    &.tm\:\-\-padding-x-24,
    &.m\:\-\-padding-x-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply px-[24px];
      }
    }

    &.\-\-padding-y-24,
    &.tm\:\-\-padding-y-24,
    &.m\:\-\-padding-y-24 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply py-[24px];
      }
    }

    &.\-\-text-18,
    &.tm\:\-\-text-18,
    &.m\:\-\-text-18 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[18px];
      }
    }

    &.\-\-text-16,
    &.tm\:\-\-text-16,
    &.m\:\-\-text-16 {
      .m-autocomplete-dropdown-no-data,
      .m-autocomplete-dropdown-button {
        @apply text-[16px];
      }
    }
  }
}
</style>
