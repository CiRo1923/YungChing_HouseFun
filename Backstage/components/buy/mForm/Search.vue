<script setup>
import { useTextCore } from './.composables/useTextCore.js'

const emits = defineEmits(['update:modelValue', 'input', 'keydown.enter'])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'text',
  },
  modelValue: {
    type: [String, Number],
    default: null,
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

const {
  model,
  config,
  setClass,
  onInput,
  onEnter: onTextEnter,
  onClear,
} = useTextCore({
  props,
  emits,
  config: {
    isEnterSearch: true,
  },
})

const isFocus = ref(false)

const onEnter = (e) => {
  if (!config.value.isEnterSearch) return

  onTextEnter(e)
}

const onFocus = (value) => {
  isFocus.value = value
}
</script>

<template>
  <div class="m-form overflow-hidden" :class="setClass.main">
    <div class="m-form-container" :class="setClass.container">
      <div class="m-form-element --search" :class="[setClass.element, { '--focus': isFocus }]">
        <input
          :id="props.name"
          :type="props.type"
          :value="model"
          class="m-form-type min-w-0 grow leading-[1]"
          :class="setClass.type"
          :placeholder="config.placeholder"
          autocomplete="off"
          @focusin="onFocus(true)"
          @blur="onFocus(false)"
          @input="onInput($event)"
          @keydown.enter="onEnter($event)"
        />
        <button
          v-if="config.hasClearButton"
          type="button"
          class="m-form-clear-button"
          :class="{
            '--show': model,
          }"
          tabindex="-1"
          @click="onClear"
        >
          <CommonSvgIcon icon="icon_xmark" class="m-form-clear-icon" />
        </button>
        <CommonSvgIcon
          icon="icon_search"
          class="m-form-search-icon shrink-0 transition-colors duration-300"
        />
      </div>
    </div>
  </div>
</template>

<style src="@css/_modules/buy/mForm.css"></style>
<style lang="postcss">
:root {
  --form-search-icon-pc-p: 2px;
  --form-search-icon-tablet-p: 2px;
  --form-search-icon-mobile-p: 2px;

  --form-search-icon-pc-size: 20px;
  --form-search-icon-tablet-size: 20px;
  --form-search-icon-mobile-size: 20px;

  --form-search-icon-color: var(--gray-ccce);
  --form-search-icon-focus-color: var(--green-6a2d);
}

.m-form-element {
  &.\-\-search {
    &:not(.\-\-focus) {
      .m-form-search-icon {
        @apply text-[--form-search-icon-color];
      }
    }

    &.\-\-focus {
      .m-form-search-icon {
        @apply text-[--form-search-icon-focus-color];
      }
    }

    .m-form-search-icon {
      @apply h-[--form-search-icon-size] w-[--form-search-icon-size] p-[--form-search-icon-p];
    }
  }
}

@screen p {
  .m-form-element {
    &.\-\-search {
      --form-search-icon-p: var(--form-search-icon-pc-p);
      --form-search-icon-size: var(--form-search-icon-pc-size);
    }
  }
}

@screen t {
  .m-form-element {
    &.\-\-search {
      --form-search-icon-p: var(--form-search-icon-tablet-p);
      --form-search-icon-size: var(--form-search-icon-tablet-size);
    }
  }
}

@screen m {
  .m-form-element {
    &.\-\-search {
      --form-search-icon-p: var(--form-search-icon-mobile-p);
      --form-search-icon-size: var(--form-search-icon-mobile-size);
    }
  }
}
</style>
