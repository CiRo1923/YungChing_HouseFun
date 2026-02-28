<script setup>
import SvgIcon from '@components/common/SvgIcon.vue'
import Anchor from '@components/buy/mAnchor.vue'

import { onDeepMerge, onDeepClone } from '@js/_prototype.js'

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
    removeAll: false, // true 可以全部刪除；false 最少要有一個
    defaultData: null,
    anchor: {
      text: null,
      icon: {
        position: 'left',
        name: 'icon_plus_circle',
      },
    },
  }
  return onDeepMerge(defaultConfig, props.config)
})

const setClass = computed(() => {
  return {
    main: '',
    container: '',
    item: '',
    anchor: '',
    ...props.setClass,
  }
})

const onAddClick = () => {
  const { defaultData } = config.value
  const data = defaultData || []

  model.value.push(onDeepClone(data))
}

const onRemoveClick = (index) => {
  model.value.splice(index, 1)
}
</script>

<template>
  <div class="m-add-identical m:space-y-[16px] pt:space-y-[8px]" :class="setClass.main">
    <ul
      class="m-add-identical-container m:space-y-[16px] pt:space-y-[8px]"
      :class="setClass.container"
    >
      <li
        class="m-add-identical-item relative overflow-hidden"
        :class="setClass.item"
        v-for="(item, index) in model"
        :key="`${props.name}_add_identical_${index}`"
      >
        <button
          type="button"
          class="m-add-identical-clear-anchor absolute right-[5px] top-[5px] block h-[22px] w-[22px] p-[5px]"
          @click="onRemoveClick(index)"
        >
          <SvgIcon icon="icon_xmark" class="h-full w-full" />
        </button>
        <div class="m-add-identical-data">
          <slot :data="item" :index="index" />
        </div>
      </li>
    </ul>
    <Anchor
      :text="config.anchor.text"
      :config="{
        icon: config.anchor.icon,
      }"
      :setClass="{
        main: ['m-add-identical-anchor --text-green-6a2d underline', setClass.anchor],
        text: 'font-normal m:text-[16px] pt:text-[14px]',
        icon: 'text-[--gray-666] m:h-[20px] m:w-[20px] pt:h-[18px] pt:w-[18px]',
      }"
      @click="onAddClick"
    />
  </div>
</template>

<style lang="postcss">
.m-add-identical {
  &.\-\-card {
    &.\-\-gray-f7 {
      .m-add-identical-item {
        @apply bg-[--gray-f7];
      }
    }
  }
}

@screen p {
  .m-add-identical {
    &.\-\-p-30,
    &.p\:\-\-p-30,
    &.pt\:\-\-p-30 {
      .m-add-identical-item {
        @apply p-[30px];
      }
    }

    &.\-\-p-24,
    &.p\:\-\-p-24,
    &.pt\:\-\-p-24 {
      .m-add-identical-item {
        @apply p-[24px];
      }
    }

    &.\-\-rounded-15,
    &.p\:\-\-rounded-15,
    &.pt\:\-\-rounded-15 {
      .m-add-identical-item {
        @apply rounded-[15px];
      }
    }
  }
}

@screen t {
  .m-add-identical {
    &.\-\-p-30,
    &.pt\:\-\-p-30,
    &.tm\:\-\-p-30,
    &.t\:\-\-p-30 {
      .m-add-identical-item {
        @apply p-[30px];
      }
    }

    &.\-\-p-24,
    &.pt\:\-\-p-24,
    &.tm\:\-\-p-24,
    &.t\:\-\-p-24 {
      .m-add-identical-item {
        @apply p-[24px];
      }
    }

    &.\-\-rounded-15,
    &.pt\:\-\-rounded-15,
    &.tm\:\-\-rounded-15,
    &.t\:\-\-rounded-15 {
      .m-add-identical-item {
        @apply rounded-[15px];
      }
    }
  }
}

@screen m {
  .m-add-identical {
    &.\-\-p-30,
    &.tm\:\-\-p-30,
    &.m\:\-\-p-30 {
      .m-add-identical-item {
        @apply p-[30px];
      }
    }

    &.\-\-p-24,
    &.tm\:\-\-p-24,
    &.m\:\-\-p-24 {
      .m-add-identical-item {
        @apply p-[24px];
      }
    }

    &.\-\-rounded-15,
    &.tm\:\-\-rounded-15,
    &.m\:\-\-rounded-15 {
      .m-add-identical-item {
        @apply rounded-[15px];
      }
    }
  }
}
</style>
