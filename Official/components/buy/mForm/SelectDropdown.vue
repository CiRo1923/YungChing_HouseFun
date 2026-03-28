<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import ErrorMessageElem from '@components/buy/mErrorMessageElem.vue'

import { onDevice, onDeepMerge } from '@js/_prototype.js'

import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Boolean, Object],
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

let rafId = null
const borderWidth = 0
const elenemtRef = ref(null)
const selectRef = ref(null)
const dropdownRef = ref(null)
const dropdownContainerRef = ref(null)
const device = ref(null)
const isFocus = ref(false)
const isActive = ref(false)
const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    emits('update:modelValue', value)
  },
})
const config = computed(() => {
  const defaultConfig = {
    arrowType: 'caret',
    placeholder: null,
    isDisabled: false,
    isError: false,
    position: 'auto',
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
      suffix: '',
      error: '',
      dropdown: '',
      dropdownContainer: '',
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

const onSwitchActive = (value) => {
  isFocus.value = value !== undefined ? value : !isFocus.value
  isActive.value = value !== undefined ? value : !isActive.value
}

const onCloseDropdown = () => {
  onSwitchActive(false)
}

const onElementClick = async () => {
  onSwitchActive()

  await nextTick()
  onDropdownOpen()
}

const onDropdownOpen = async () => {
  const $elenemt = elenemtRef.value
  const $dropdown = dropdownRef.value
  const $dropdownContainer = dropdownContainerRef.value
  const element = {
    rect: $elenemt.getBoundingClientRect(),
  }

  if ($elenemt && $dropdown && $dropdownContainer) {
    const dropdown = {
      rect: $dropdown.getBoundingClientRect(),
    }

    const offsetTop = element.rect.height + element.rect.top + window.scrollY
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

    await nextTick()

    const dropdownContainer = {
      style: window.getComputedStyle($dropdownContainer),
      scrollHeight: $dropdownContainer.scrollHeight,
    }

    const maxHeight =
      dropdownContainer.scrollHeight + parseFloat(dropdownContainer.style.padding, 10)

    if (rafId) cancelAnimationFrame(rafId)

    rafId = requestAnimationFrame(() => {
      rafId = null

      $dropdown.style.height = `${maxHeight}px`
      $dropdown.style.top = `${offsetTop - borderWidth * 2}px`
      $dropdown.style.left = `${left - borderWidth}px`

      if (dropdown.rect.width < element.rect.width) {
        $dropdown.style.minWidth = `${element.rect.width}px`
      }
    })
  }
}

const onDropdownEnter = () => {
  const $selectRef = selectRef.value

  onSwitchActive(false)
  $selectRef.blur()
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
  device.value = onDevice()
  onDropdownOpen()
}

onMounted(() => {
  onResize()
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onResize)
})

defineExpose({
  onClose: onCloseDropdown,
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
          class="m-form-element --select-dropdown grow text-left"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          :disabled="config.isDisabled"
          ref="elenemtRef"
          @click="onElementClick()"
          @keypress.enter="onDropdownEnter"
        >
          <em
            class="m-form-type flex w-full cursor-pointer items-center truncate leading-[1]"
            :class="[
              setClass.type,
              {
                '--placeholder': !model,
              },
            ]"
            v-html="model || placeholder.value"
            ref="selectRef"
          />
          <SvgIcon
            icon="caret_large_down"
            class="m-form-icon h-[14px] w-[14px] shrink-0 p-[2px] transition-transform duration-300"
            :class="setClass.icon"
            v-if="config.arrowType === 'caret'"
          />
          <i
            class="m-form-icon-arrow h-[16px] w-[16px] shrink-0"
            v-if="config.arrowType === 'arrow'"
          />
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
      <ErrorMessageElem :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="select-dropdown" @after-leave="onCloseDropdown" appear>
      <div
        class="m-select-dropdown shadow-dropdown absolute z-[2] overflow-hidden rounded-[4px] p:mt-[10px]"
        :class="setClass.dropdown"
        ref="dropdownRef"
        v-if="isActive && !config.isDisabled"
      >
        <div
          class="m-select-dropdown-container max-h-full bg-[--white]"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/_vueTransition.css"></style>
<style lang="postcss"></style>
