<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   assets/css/_common/vueTransition.css
     轉場動畫定義在這裡。沒有它不會報錯也不會少畫面,只是切換的當下直接跳、沒有漸變。
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。
   scripts/_validation.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */
import './.css/variables.css'
import './.css/selectVariables.css'
import './.css/common.css'
import './.css/select.css'
import './.css/styleProject.css'

import {
  isUnselected,
  onMergeDropdownConfig,
  useDropdownCore,
} from './.composables/useDropdownCore.js'
import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepClone, onEmptyData } from '@js/_prototype.js'
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

    if (props.modelModifiers?.number) {
      result = value === '' ? null : Number(value)
    }

    emits('update:modelValue', result)
  },
})
const config = computed(() => {
  const defaultConfig = {
    // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
    // (touchedModelUpdate 的用意見 .composables/useValidateEvents.js)。
    // 傳陣列為「完整指定」,沒列到的一律關閉。
    /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
    attr: {},
    validateEvents: ['blur', 'change', 'touchedModelUpdate'],
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
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)

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
      dropdownLabel: '',
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

/* 選項清單 —— 底下每一個讀 item[schema.…] 的地方都是從這裡拿到資料。

  **壞掉的元素在這裡一次濾掉,不在各個使用端各加一道。**
  讀屬性的地方有五、六處,各自加防護的話那就是五、六份判斷,
  而往後新增第七處的人不會知道要補 —— 漏掉的那一處照樣會爆。

  為什麼會有壞元素:選項常常來自非同步資料,還沒回來的那幾筆是 null。
  不濾掉的話,第一個讀到它的地方就丟例外,而那發生在 setup 的同步呼叫裡
  (見下面的 onSetSelectedIndex)—— 整個路由導航會失敗,
  使用端看到的是一片白畫面,看不出是哪個欄位、哪一筆資料的問題。 */
const options = computed(() => {
  const { schema } = config.value
  const { value, isToOption } = placeholder.value

  const raw = props.options ? onDeepClone(props.options) : []
  const options = raw.filter((item) => item !== null && typeof item === 'object')

  /* 濾掉了就要講出來 —— 靜靜拿掉的話,傳錯資料的人永遠不知道自己傳了什麼,
     只會看到選項少了幾個。這裡是唯一知道「原本有幾筆、留下幾筆」的位置。 */
  if (import.meta.env.DEV && options.length !== raw.length) {
    console.warn(
      `[mForm] Select${props.name ? `(${props.name})` : ''} 的 options 有 ` +
        `${raw.length - options.length} 筆不是物件(多半是非同步資料還沒回來),已略過。` +
        `每一筆都要帶 ${schema.value} 與 ${schema.label}`
    )
  }

  if (isToOption) {
    /* 提示項照第一筆的形狀做出來,其餘欄位清空 —— 使用端的選項常常帶著
       額外欄位(分類、圖示),提示項少了那些的話,畫面上它會長得跟別人不一樣。

       一筆都沒有的時候沒有形狀可以照,就只放這一項自己要用的兩個欄位。
       直接對 options[0] 做的話,空清單時拿到的是 undefined,
       下面兩行賦值當場丟例外 —— 而這裡在 setup 裡算,結果是整頁空白。 */
    const placeholderItem = options.length ? onEmptyData(onDeepClone(options[0])) : {}

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
    /* 兩邊都用寬鬆比對(==):選項的值常常是數字,而回填進來的是字串,
      用嚴格比對會全部對不上('1' !== 1)。

      未填的情況要先擋掉再比 —— 寬鬆比對底下 '' == 0 是成立的,
      選項裡有值為 0 的那一項時,「還沒選」會顯示成它的文字,
      而使用者沒有選過任何東西(判斷收在 useDropdownCore 的 isUnselected)。 */
    if (startOption) {
      index = options.value.findIndex((item) => item.value == startOption)
    } else if (!isUnselected(model.value)) {
      index = options.value.findIndex((item) => item[config.value.schema.value] == model.value)
    }

    // index = index === -1 ? 0 : index
    label.value = index !== -1 ? options.value[index][config.value.schema.label] : null
  }

  selectedIndex.value = index
}

const {
  elementRef,
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
  // 收起下拉時標記「碰過」—— 綁 Field 的那個隱藏欄位永遠不會 blur
  fieldName: () => props.name,
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

/* 在 setup 就算一次 —— label 與 selectedIndex 是從 model + options 推導出來的,
  但它們是 ref、靠上面兩個 watch 與下面的 onMounted 手動同步。那三個點
  **沒有一個會在 SSR 期間跑到**(watch 沒有 immediate、onMounted 只在 client),
  所以 server render 出來的 label 是 null:有初始值的欄位會先閃一次空白,
  hydrate 之後才補上文字。

  注意:這裡呼叫的是純資料計算(不碰 DOM),在 server 端執行是安全的。 */
onSetSelectedIndex()

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
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      :name="props.name"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <input type="hidden" :id="props.name" v-bind="field" />
      <div class="m-form-container" :class="setClass.container" v-bind="config.attr.container">
        <button
          type="button"
          class="m-form-element --select"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--error': errorMessage || config.isError },
          ]"
          v-bind="config.attr.element"
          :disabled="config.isDisabled"
          ref="elementRef"
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
            v-bind="config.attr.type"
            ref="selectRef"
          >
            <template v-if="label">
              {{ label }}
            </template>
            <template v-else-if="!label && placeholder.value">
              {{ placeholder.value }}
            </template>
          </div>
          <CommonMSvgIcon
            :icon="config.arrowIcon"
            class="m-form-icon"
            :class="setClass.icon"
            v-bind="config.attr.icon"
            v-if="config.arrowIcon"
          />
        </button>
        <small
          class="m-form-suffix"
          :class="setClass.suffix"
          v-bind="config.attr.suffix"
          v-if="$slots.suffix"
        >
          <slot name="suffix" />
        </small>
      </div>
    </Field>
    <ErrorMessage
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
      v-bind="config.attr.error"
      v-slot="{ message }"
    >
      <CommonMErrorMessage :message="message" />
    </ErrorMessage>
  </div>
  <Teleport to="body">
    <Transition name="anim-collapse" @afterLeave="onCloseDropdown" appear>
      <div
        class="m-form-select-dropdown"
        :class="[setClass.dropdown, { '--open': isOpen }]"
        v-bind="config.attr.dropdown"
        ref="dropdownRef"
        v-if="isActive && options && options.length !== 0 && !config.isDisabled"
      >
        <div
          class="m-form-select-dropdown-container"
          :class="setClass.dropdownContainer"
          v-bind="config.attr.dropdownContainer"
          ref="dropdownContainerRef"
        >
          <ul
            class="m-form-select-dropdown-body"
            :class="setClass.dropdownBody"
            v-bind="config.attr.dropdownBody"
            ref="dropdownBodyRef"
          >
            <li
              class="m-form-select-dropdown-item"
              v-for="(item, index) in options"
              :key="`${item}_${index}`"
              ref="dropdownItemRef"
            >
              <button
                type="button"
                class="m-form-select-dropdown-button"
                :class="{
                  '--active': index === selectedIndex,
                }"
                :disabled="item[config.schema.isDisabled] === true"
                @click="onDropdownItemClick(index)"
              >
                <em
                  class="m-form-select-dropdown-label"
                  :class="setClass.dropdownLabel"
                  v-bind="config.attr.dropdownLabel"
                >
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
