<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { onDeepMerge } from '@js/_prototype.js'

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
const isSelectingOption = ref(false)
const inputLabel = ref(null)
const selected = ref({
  index: null,
})
const dropdownItems = ref(null)
const apiOptions = ref([])
const fetchId = ref(0)

const apiWaitRafId = ref(null)
const apiWaitToken = ref(0)

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
    noMatchClearLabel: false,
    noResult: '無任何選項。',
    isDisabled: false,
    isExistClose: true,
    isError: false,
    position: 'auto',
    schema: {
      search: null,
      data: null,
      label: 'label',
      value: 'value',
      model: 'label',
    },
    api: {
      path: null,
      params: null,
      wait: 500,
      minChars: 1,
    },
    keyboard: false,
    maxItems: 5,
  }

  return onDeepMerge(defaultConfig, props.config)
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

const resolvedOptions = computed(() => {
  const { api } = config.value

  return api.path ? apiOptions.value : Array.isArray(props.options) ? props.options : []
})

const isMinCharsReached = computed(() => {
  const { api } = config.value

  if (!api.path) return true
  return (inputLabel.value?.trim()?.length || 0) >= api.minChars
})

const cancelApiWait = () => {
  apiWaitToken.value++

  if (apiWaitRafId.value !== null) {
    cancelAnimationFrame(apiWaitRafId.value)
    apiWaitRafId.value = null
  }
}

const waitByRaf = (duration) => {
  cancelApiWait()

  const currentToken = apiWaitToken.value
  const wait = Number(duration) || 0

  if (wait <= 0) return Promise.resolve(true)

  return new Promise((resolve) => {
    let startTime = null

    const step = (timestamp) => {
      if (currentToken !== apiWaitToken.value) {
        resolve(false)
        return
      }

      if (startTime === null) {
        startTime = timestamp
      }

      if (timestamp - startTime >= wait) {
        apiWaitRafId.value = null
        resolve(true)
        return
      }

      apiWaitRafId.value = requestAnimationFrame(step)
    }

    apiWaitRafId.value = requestAnimationFrame(step)
  })
}

const onApiFeatch = async () => {
  const { schema, api } = config.value
  const keyword = inputLabel.value?.trim() || ''

  if (typeof api.path !== 'function') return

  if (keyword.length < api.minChars) {
    apiOptions.value = []
    dropdownItems.value = null
    return
  }

  const currentFetchId = ++fetchId.value

  try {
    const {
      config: apiConfig,
      status,
      data,
    } = await api.path({
      [schema.search]: inputLabel.value,
      ...api.params,
    })

    if (currentFetchId !== fetchId.value) return

    if (status === 200) {
      const result = schema.data ? data?.[schema.data] : data
      apiOptions.value = Array.isArray(result) ? result : []
    } else {
      apiOptions.value = []
    }

    dropdownItems.value = apiOptions.value
    emits('search', { config: apiConfig, status, data })
  } catch (error) {
    if (currentFetchId !== fetchId.value) return

    apiOptions.value = []
    dropdownItems.value = []
    console.error('[mAutoComplete] api search failed', error)
  }
}

const onApiFeatchWithWait = async () => {
  const { api } = config.value
  const keyword = inputLabel.value?.trim() || ''

  if (typeof api.path !== 'function') return

  if (keyword.length < api.minChars) {
    cancelApiWait()
    apiOptions.value = []
    dropdownItems.value = null
    return
  }

  const canContinue = await waitByRaf(api.wait)

  if (!canContinue) return

  if ((inputLabel.value?.trim() || '').length < api.minChars) {
    apiOptions.value = []
    dropdownItems.value = null
    return
  }

  await onApiFeatch()
}

const onFilter = () => {
  const { api, schema } = config.value
  const sourceOptions = resolvedOptions.value

  if (api.path) {
    dropdownItems.value = isMinCharsReached.value ? sourceOptions : null
    return
  }

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

  inputLabel.value = model.value
}

const onResetDropdownItems = () => {
  const sourceOptions = resolvedOptions.value
  dropdownItems.value = sourceOptions.length !== 0 ? sourceOptions : null
}

const onIsComposingChange = (boolean) => {
  isComposing.value = boolean
}

const onFocus = async () => {
  const { api } = config.value

  if (api.path) {
    if (!isMinCharsReached.value) {
      onSwitchActive(false)
      return
    }

    await onApiFeatch()
  } else {
    onResetDropdownItems()
  }

  onSwitchActive(true)

  await nextTick()
  onDropdownOpen()
}

const onInput = async () => {
  const { api } = config.value

  if (isComposing.value) return

  if (api.path) {
    if (!isMinCharsReached.value) {
      cancelApiWait()
      onSwitchActive(false)
      return
    }

    onSwitchActive(true)
    await onApiFeatchWithWait()
  }

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await nextTick()
  onDropdownOpen()
}

const onCompositionEnd = async () => {
  const { api } = config.value

  onIsComposingChange(false)

  if (api.path) {
    if (!isMinCharsReached.value) {
      cancelApiWait()
      onSwitchActive(false)
      return
    }

    onSwitchActive(true)
    await onApiFeatchWithWait()
  }

  onFilter()

  if (!isMinCharsReached.value) {
    onSwitchActive(false)
    return
  }

  await nextTick()
  onDropdownOpen()
}

const onBlur = () => {
  cancelApiWait()

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
  emits('change', item)
}

const onDropdownItemMousedown = () => {
  isSelectingOption.value = true
}

const onClear = () => {
  const { api } = config.value

  cancelApiWait()
  model.value = ''
  inputLabel.value = null
  selected.value.index = null
  dropdownItems.value = api.path ? null : dropdownItems.value
  emits('change', null)
}

const onInit = () => {
  const { api } = config.value

  if (!api.path) {
    onFilter()
  }
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
    const { api } = config.value

    if (!api.path) {
      onGetInputLabel()
      onFilter()
    }
  },
  { deep: true }
)

watch(
  apiOptions,
  () => {
    const { api } = config.value

    if (api.path) {
      onGetInputLabel()
    }
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
  cancelApiWait()
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
})
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
            tabindex="-1"
            @click="onClear"
            v-if="config.isExistClose && !config.isDisabled"
          >
            <SvgIcon icon="icon_xmark" class="m-autocomplete-clear-icon" />
          </button>
          <SvgIcon
            icon="icon_search"
            class="pointer-events-none h-[18px] w-[18px] shrink-0 text-[--autocomplete-icon-color] transition-colors duration-300"
          />
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
    <Transition name="autocomplete" @after-leave="onCloseDropdown" appear>
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
              @mousedown="onDropdownItemMousedown"
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
  }

  &:not(.\-\-error) {
    --autocomplete-icon-color: var(--gray-ccce);
    --autocomplete-border-color: var(--gray-e5);
  }
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
