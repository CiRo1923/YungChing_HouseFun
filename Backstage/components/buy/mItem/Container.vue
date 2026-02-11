<script>
import { computed, ref } from 'vue'

export default {
  name: 'm-item-container',
}
</script>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
  config: {
    type: Object,
    default: () => {},
  },
  setClass: {
    type: Object,
    default: () => {},
  },
})
const containerRef = ref(null)

const labelFirst = computed(() => (props.data[0] && props.data[0].label) || '')

const setClass = computed(() => {
  return {
    ...{
      container: '',
      item: '',
    },
    ...props.setClass,
  }
})

const isChinese = computed(
  () => /[\u4e00-\u9fa5]/.test(props.data.label) || /[\u4e00-\u9fa5]/.test(labelFirst.value)
)

const isDefaultLabel = computed(() => /(decimal|disc|zh|alpha|roman)/.test(props.data.label))
const stringLabel = computed(() => (isDefaultLabel.value ? String(props.data.label) : null))
const labelClass = computed(() => (stringLabel.value ? `--${stringLabel.value}` : ''))
const labelData = computed(() =>
  props.data.label && !isDefaultLabel.value ? props.data.label : null
)

const as = computed(() => {
  const { as } = props.config || {}

  return as
    ? as
    : /disc/.test(labelFirst.value) || /disc/.test(props.data.label) || isChinese
      ? 'ul'
      : 'ol'
})

// const getLabel = (label, index) => {
//   const value = label || props.data.label
//   let label = null
//   const idx = props.data.items.length < 10 ? index + 1 : index < 10 ? `0${index + 1}` : index + 1

//   switch (true) {
//     case /disk/.test(value):
//       label = '．'
//       break
//     case /decimal/.test(value):
//       label = value.replace(/decimal/, idx)
//       break
//     case /chNumber/.test(value):
//       label = value.replace(/chNumber/, chNumber.value[index])
//       break
//     default:
//       label = value ? value.replace(/{\s?index\s?}/, idx) : `${idx}.`
//       break
//   }

//   return label
// }

defineExpose({
  container: containerRef,
})
</script>
<template>
  <component
    :is="as"
    class="m-item-container"
    :class="[labelClass, setClass.container]"
    :key="'m-item_' + props.data.items.length"
    ref="containerRef"
  >
    <li
      class="m-item-container-list flex items-baseline"
      :class="setClass.item"
      :data-label="labelData"
      v-for="(item, index) in props.data.items"
      :key="`m_item_${index}`"
    >
      <p class="flex-grow" v-html="item.item" v-if="!item.children" />
      <div class="flex-grow" v-else>
        <p v-html="item.item" />
        <m-item-container
          :data="item.children"
          :key="'m-item_' + index + '_' + item.children.length"
          v-bind="config.childrenUseRootClass ? { setClass: setClass } : ''"
        />
      </div>
    </li>
  </component>
</template>

<style lang="postcss">
.m-item-container {
  counter-reset: item;

  &.\-\-disc {
    > .m-item-container-list {
      &:before {
        content: '•';
      }
    }
  }

  /* 數字 1. 2. 3. ... */
  &.\-\-decimal {
    > .m-item-container-list {
      &:before {
        content: counter(item) '.';
      }
    }
  }

  /* 0 + 數字 01. 02. 03. ... */
  &.\-\-decimal-leading-zero {
    > .m-item-container-list {
      &:before {
        content: counter(item, decimal-leading-zero) '.';
      }
    }
  }
}

.m-item-container-list {
  counter-increment: item;

  &:before {
    @apply pointer-events-none flex-shrink-0;
  }

  &[data-label] {
    &:before {
      &[data-label=''] {
        @apply content-default;
      }
    }

    &:not([data-label='']) {
      &:before {
        @apply mr-[5px] content-[attr(data-label)];
      }
    }
  }
}
</style>
