<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */

import './.css/variables.css'
import './.css/selectionVariables.css'
import './.css/radioVariables.css'
import './.css/common.css'
import './.css/selection.css'
import './.css/radio.css'
import './.css/styleProject.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number, Array, null],
    default: '',
  },
  rules: {
    type: Object,
    default: null,
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

const model = computed({
  get: () => props.modelValue,
  set(value) {
    emits('update:modelValue', value)
  },
})

const config = computed(() => {
  return onDeepMerge(
    {
      /* 驗證時機。勾選類控制項兩件事都刻意不做 —— 不吃 blur(Tab 經過還沒選就跳紅字
        是誤報;但 handleBlur 仍會標記 touched)、也不吃 change(change 就是
        「使用者剛選了它」,那時跳紅字等於一選就罵人)。
        只留 touchedModelUpdate,詳見 .composables/useValidateEvents.js */
      /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
      attr: {},
      validateEvents: ['touchedModelUpdate'],
      label: null,
      value: null,
      align: 'top',
      /* 選取後顯示哪一支圖示,**留空就不畫** —— 留空時是樣式畫的那個實心圓點。

        圖示的名字每個專案都不一樣(各站的 _svg 裡叫什麼由那個站決定),
        所以是設定而不是寫死在畫面區段裡 —— 寫死的話換一個專案要改元件本身,
        而那一段跟著來源覆蓋:改完下一次更新就被蓋回去。

        單選與複選的選取指示是同一支打勾圖示、只有外框形狀不同(圓框 vs 方框)
        的站,填了它就共用同一支元件;不填的維持圓點,一行都不用改。 */
      checkIcon: null,
      isDisabled: false,
      /* 這一顆自己沒有驗證,而是整組共用一個 —— 紅框由包住整組的那支元件傳下來。

        一題單選那幾顆不各自帶驗證(那樣同一句話會在畫面上重複好幾行),
        驗證掛在包裝元件上,各顆只負責選取與錯誤外觀。所以「要不要亮紅框」
        這件事只能由外面告訴它。

        少了這一項的話,照規範那樣寫的那一組紅框不會亮,**而且不報錯** ——
        傳一個元件不認得的設定項就是靜靜地沒有作用。複選那一組正常、
        只有單選不亮,從畫面上看像是「單選的驗證壞掉了」。 */
      isError: false,
    },
    props.config
  )
})
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)

const isChecked = computed(() => {
  const { value } = config.value
  return model.value === value
})

const setClass = computed(() => {
  return {
    ...{
      main: '',
      content: '',
      element: '',
      icon: '',
      label: '',
      error: '',
    },
    ...props.setClass,
  }
})

const onChange = () => {
  const { label, value } = config.value
  emits('change', {
    label,
    value,
  })
}
</script>

<template>
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      :name="props.name"
      type="radio"
      v-model="model"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
      v-slot="{ field, errorMessage }"
    >
      <div
        class="m-form-container"
        :class="[{ '--no-label': !config.label }, setClass.container]"
        v-bind="config.attr.container"
      >
        <label
          class="m-form-element --radio"
          :class="[
            { '--align-top': config.align === 'top' },
            /* 選中狀態掛在這一層,使用端的樣式才接得到 ——
              勾選狀態在 <input> 上,而它是這個 <label> 的子元素:
              css 沒有辦法讓父層對子層的狀態有反應(`:has()` 以外沒有第二種寫法,
              而那個在比較舊的內嵌瀏覽器上不成立)。使用端也算不出來,
              那要比對 modelValue,是元件內部才有的資訊。 */
            { '--checked': isChecked },
            { '--disabled': config.isDisabled },
            { '--has-label': config.label || $slots.default },
            { '--error': errorMessage || config.isError },
            setClass.element,
          ]"
          v-bind="config.attr.element"
        >
          <input
            type="radio"
            v-bind="field"
            :value="config.value"
            :checked="isChecked"
            class="m-form-type jFormValid"
            :disabled="config.isDisabled"
            @change="onChange"
          />
          <CommonMSvgIcon
            :icon="config.checkIcon"
            class="m-form-icon"
            :class="setClass.icon"
            v-bind="config.attr.icon"
            v-if="config.checkIcon"
          />
          <i class="m-form-icon" :class="setClass.icon" v-bind="config.attr.icon" v-else />
          <slot>
            <em class="m-form-label" :class="setClass.label" v-bind="config.attr.label">{{
              config.label
            }}</em>
          </slot>
        </label>
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
</template>
