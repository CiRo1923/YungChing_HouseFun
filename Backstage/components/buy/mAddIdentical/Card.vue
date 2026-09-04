<script setup>
import '@css/_modules/buy/mAddIdentical/variables.css'
import '@css/_modules/buy/mAddIdentical/cardVariables.css'
import '@css/_modules/buy/mAddIdentical/common.css'
import '@css/_modules/buy/mAddIdentical/card.css'

import { useAddIdenticalCore } from './.composables/useAddIdenticalCore.js'

const emits = defineEmits(['update:modelValue', 'click'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: Array,
    default: () => [],
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

const { model, config, setClass, onAddClick, onRemoveClick } = useAddIdenticalCore({
  props,
  emits,
})
</script>

<template>
  <div class="m-add-identical --card" :class="setClass.main">
    <ul class="m-add-identical-container" :class="setClass.container">
      <li
        class="m-add-identical-item"
        :class="setClass.item"
        v-for="(item, index) in model"
        :key="`${props.name}_add_identical_${index}`"
      >
        <button
          type="button"
          class="m-add-identical-clear-anchor"
          @click="onRemoveClick(index)"
          v-if="config.keepDelItems < model.length"
        >
          <CommonSvgIcon icon="icon_xmark" class="m-add-identical-clear-icon" />
        </button>
        <div class="m-add-identical-data">
          <slot :data="item" :index="index" />
        </div>
      </li>
    </ul>
    <BuyMAnchor
      :text="config.anchor.text"
      :config="{
        icon: config.anchor.icon,
      }"
      :setClass="{
        main: ['m-add-identical-anchor --text-green-6a2d', setClass.anchor],
        text: ['m-add-identical-anchor-text', setClass.anchorText],
        icon: 'm-add-identical-anchor-icon',
      }"
      @click="onAddClick"
    />
  </div>
</template>
