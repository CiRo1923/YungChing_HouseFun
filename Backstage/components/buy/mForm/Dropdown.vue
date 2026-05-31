<script setup>
import { onMergeDropdownConfig, useDropdownCore } from './.composables/useDropdownCore.js'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
})

const selectedIndex = ref(-1)
const options = computed(() => [])
const config = computed(() => {
  return onMergeDropdownConfig(props.config)
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      icon: '',
      dropdown: '',
      dropdownContainer: '',
    },
    ...props.setClass,
  }
})

const {
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onCloseDropdown,
  onDropdownOpen,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
} = useDropdownCore({
  config,
  options,
  selectedIndex,
})

const onOutSide = (e) => {
  if (isDropdownOutside(e)) {
    onSwitchActive(false)
  }
}

defineExpose({
  elenemtRef,
  dropdownRef,
  dropdownContainerRef,
  dropdownItemRef,
  isActive,
  isFocus,
  isOpen,
  onSwitchActive,
  onDropdownOpen,
  onElementClick,
  onSelectResize,
  isDropdownOutside,
})

onMounted(() => {
  document.addEventListener('click', onOutSide, true)
  window.addEventListener('resize', onSelectResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutSide, true)
  window.removeEventListener('resize', onSelectResize)
})
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <div class="m-form-container flex" :class="setClass.container">
      <button
        type="button"
        class="m-form-element --select"
        :class="[
          setClass.element,
          {
            '--focus': isFocus,
          },
        ]"
        :disabled="config.isDisabled"
        ref="elenemtRef"
        @click="onElementClick()"
      >
        <div class="m-form-type" :class="setClass.type">
          <slot />
        </div>
        <CommonSvgIcon
          icon="caret_large_down"
          class="m-form-icon"
          :class="setClass.icon"
          v-if="config.arrowType === 'caret'"
        />
        <i class="m-form-icon-arrow" v-if="config.arrowType === 'arrow'" />
      </button>
    </div>
  </div>
  <Teleport to="body">
    <Transition name="dropdown" @before-leave="onCloseDropdown" appear>
      <div
        class="m-form-dropdown --dropdown"
        :class="[setClass.dropdown, { '--open': isOpen }]"
        ref="dropdownRef"
        v-if="isActive && !config.isDisabled"
      >
        <div
          class="m-form-dropdown-container scrollbar --y"
          :class="setClass.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <div class="m-form-dropdown-header" v-if="$slots.dropdownHeader">
            <slot name="dropdownHeader" />
          </div>
          <div class="m-form-dropdown-body">
            <slot name="dropdown" />
          </div>
          <footer class="m-form-dropdown-footer" v-if="$slots.dropdownFooter">
            <slot name="dropdownFooter" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormDropdown.css"></style>
<style lang="postcss"></style>
