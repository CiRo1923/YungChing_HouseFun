<script setup>
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({
      schema: {
        label: 'label',
        value: 'value',
        isDisabled: 'isDisabled',
      },
      dropdownOption: {
        type: 'single',
      },
    }),
  },
  setClass: {
    type: Object,
    default: () => ({}),
  },
  isActiveOption: {
    type: Function,
    default: () => false,
  },
  onItemClick: {
    type: Function,
    default: () => {},
  },
  rootRef: {
    type: Function,
    default: null,
  },
  itemRef: {
    type: Function,
    default: null,
  },
  itemRefIndexOffset: {
    type: Number,
    default: 0,
  },
  getKey: {
    type: Function,
    default: null,
  },
})

const onRootRef = (el) => {
  props.rootRef?.(el)
}

const onItemRef = (el, index) => {
  props.itemRef?.(el, props.itemRefIndexOffset + index)
}

const optionConfig = computed(() => {
  return {
    schema: {
      label: 'label',
      value: 'value',
      isDisabled: 'isDisabled',
      ...props.config.schema,
    },
    dropdownOption: {
      type: 'single',
      ...props.config.dropdownOption,
    },
  }
})

const onGetKey = (item, index) => {
  return props.getKey?.(item, index) ?? item?.[optionConfig.value.schema.value] ?? `${item}_${index}`
}

const dropdownOptionConfig = computed(() => {
  return optionConfig.value.dropdownOption
})
</script>

<template>
  <ul
    class="m-form-dropdown-options"
    :class="[setClass.dropdownOptions, `--${dropdownOptionConfig.type}`]"
    :ref="onRootRef"
  >
    <li
      class="m-form-dropdown-item"
      v-for="(item, index) in options"
      :key="onGetKey(item, index)"
      :ref="(el) => onItemRef(el, index)"
    >
      <button
        type="button"
        class="m-form-dropdown-button"
        :class="[
          setClass.dropdownButton,
          {
            '--active': isActiveOption(item, index),
          },
        ]"
        :disabled="item[optionConfig.schema.isDisabled] === true"
        @click="onItemClick(item, index)"
      >
        <CommonSvgIcon
          icon="icon_check_solid"
          class="m-form-dropdown-icon"
          v-if="isActiveOption(item, index)"
        />
        <em class="m-form-dropdown-label">
          <slot
            name="option"
            :item="item"
            :index="index"
            :isOptionActive="isActiveOption(item, index)"
          >
            {{ item[optionConfig.schema.label] }}
          </slot>
        </em>
      </button>
    </li>
  </ul>
</template>
