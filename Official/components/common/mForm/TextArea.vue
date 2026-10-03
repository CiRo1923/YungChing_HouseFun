<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。
   scripts/_validation.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */

import './.css/variables.css'
import './.css/common.css'
import './.css/textarea.css'
import './.css/styleProject.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'
import '@js/_validation.js'

import { Field, ErrorMessage } from 'vee-validate'

const emits = defineEmits([
  'update:modelValue',
  'focusin',
  // 'focusout',
  'blur',
  'input',
])

const props = defineProps({
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  value: {
    type: [String, Number],
    default: null,
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
const model = ref(null)
const isFocus = ref(false)
const config = computed(() => {
  return onDeepMerge(
    {
      /* 要掛在元素上的屬性,依位置各一組 —— 位置名與 setClass 同一套
        (能傳 class 的地方就能傳屬性),例如 { type: { 'data-x': 'y' } }。

        有些東西只能靠元素上的屬性做到:難字的造字對照、無障礙的標記、
        第三方套件用屬性認元素 —— 那幾種沒辦法用 class 或 slot 代替。

        預設是空的,傳進來才掛。 */
      attr: {},
      placeholder: '',
      // 驗證時機。blur / change 一律驗;值一動就驗只在「碰過之後」才生效
      // (touchedModelUpdate 的用意見 .composables/useValidateEvents.js)。
      // 傳陣列為「完整指定」,沒列到的一律關閉。
      validateEvents: ['blur', 'change', 'touchedModelUpdate'],
      rows: null,
      /* 長度限制 —— 四個名字很像,行為各不相同:

           length        同時當下限與上限的捷徑(要求「剛好幾個字」時給這一個)
           minlength     下限。給了就蓋過 length
           maxlength     上限。給了就蓋過 length
           formatLength  字數**怎麼顯示**的範本,例如 '{length} / {maxlength}' ——
                         `{length}` 換成目前打了幾個字,`{maxlength}` 換成上限。
                         沒給這一項就不顯示字數那一格

         前三個是數字(限制本身),最後一個是字串(顯示方式)。
         **字數要顯示得出來,得先有上限** —— 範本裡的 `{maxlength}` 沒有值可填的話,
         那一格不會出現。上限來自 maxlength 或 length,給哪一個都算。 */
      length: null,
      minlength: null,
      maxlength: null,
      formatLength: null,
      isReadonly: false,
      isDisabled: false,
      isError: false,
      hasClearButton: true, // 輸入後開啟 X 清除
      inputChinese: true, // 開啟關閉輸入中文
    },
    props.config
  )
})
const validateOn = useValidateEvents(
  () => config.value.validateEvents,
  () => props.name
)
/* 下限與上限各算一次 —— `length` 是兩者共用的捷徑,各自的那一個給了就蓋過它。

  **算在同一個地方,是因為用到它的有好幾處**(輸入框的屬性、字數那一格)。
  各處自己寫一次 `maxlength || length` 的話,其中一處漏掉 fallback 就會變成:
  只給 length 的欄位,輸入框擋得住字數,而字數那一格不出現 ——
  兩邊看起來像各自壞了一半。 */
const minLength = computed(() => config.value.minlength || config.value.length)
const maxLength = computed(() => config.value.maxlength || config.value.length)
const formatLength = computed(() => {
  const { formatLength } = config.value
  const maxlength = maxLength.value

  return formatLength && maxlength
    ? formatLength.replace(/\{\s*(length|maxlength)\s*\}/g, (_, key) => {
        return key === 'length' ? (model.value ? String(model.value.length) : 0) : String(maxlength)
      })
    : null
})
/* 每一個位置一個名字,而且要與畫面那一段實際讀的名字相同 ——
  列了而畫面沒讀的那一個,使用端傳進來不會有任何作用,**也不會報錯**。

  多行輸入沒有前後綴那幾個位置:它的內容是整塊文字,
  旁邊放圖示或單位會擠掉本來就不多的寬度。要在欄位旁邊加東西的,
  放在這支元件外面,那一層歸使用端自己排。 */
const setClass = computed(() => {
  return {
    ...{
      main: '',
      container: '',
      element: '',
      type: '',
      length: '',
      error: '',
    },
    ...props.setClass,
  }
})
/* 這個欄位與表單的連動(名稱、事件、值)—— 畫面那一行把它接在
   使用端掛的屬性**後面**:順序反過來的話,使用端傳了同名的屬性就會蓋掉它,
   而那個欄位從此不再跟著表單走,不會報錯,只是驗證與送出都收不到它。 */
const onBind = (field) => {
  const value =
    !props.modelValue && props.value
      ? {
          value: props.value,
        }
      : {}

  return {
    ...field,
    ...value,
  }
}

const onInput = async (e) => {
  const value = e.target.value
  const { inputChinese } = config.value
  const chinese = /[一-龥０-９Ａ-Ｚａ-ｚ～！＠＃＄％︿＆＊（）＿｜｛｝［］＜＞？／＊＼＋－]/g

  await nextTick()

  if (!inputChinese && chinese.test(value)) {
    model.value = value.replace(chinese, '')
  }

  emits('input', e)
}

const onEvent = async (e, errorMessage) => {
  const { type } = e
  const isError = !!errorMessage
  const isFocusIn = type === 'focusin'
  const isBlur = type === 'blur'

  if (isFocusIn || isBlur) {
    isFocus.value = !isFocus.value
  }

  if (isBlur) {
    emits('update:modelValue', model.value)
    // blur 時等 update:modelValue 回填到上層 props 後再 emit，父層 onBlur 才讀得到最新值
    await nextTick()
  }

  emits(type, e, isError)
}

watch(
  () => props.modelValue,
  (value) => {
    model.value = value
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div class="m-form" :class="setClass.main" v-bind="config.attr.main">
    <Field
      v-slot="{ field, errorMessage }"
      v-model="model"
      :name="props.name"
      :rules="config.isDisabled ? '' : props.rules"
      v-bind="validateOn"
    >
      <div
        class="m-form-container --textarea"
        :class="setClass.container"
        v-bind="config.attr.container"
      >
        <div
          class="m-form-element --textarea"
          :class="[
            setClass.element,
            { '--focus': isFocus },
            { '--readonly': config.isReadonly },
            { '--disabled': config.isDisabled },
            { '--error': errorMessage || config.isError },
          ]"
          v-bind="config.attr.element"
        >
          <textarea
            class="m-form-type"
            :class="setClass.type"
            v-bind="{ ...config.attr.type, ...onBind(field) }"
            :rows="config.rows"
            :minlength="minLength"
            :maxlength="maxLength"
            :placeholder="config.placeholder"
            :readonly="config.isReadonly"
            :disabled="config.isDisabled"
            autocomplete="off"
            @focusin="onEvent($event)"
            @blur="onEvent($event, errorMessage)"
            @input="onInput($event)"
          />
          <!-- 字數在框線**裡面**的右下角 —— 框畫在外面這一層(.m-form-element),
            所以字數要放在它裡面才落在框內。

            要讓字數落在框外的站:把這一段移到 .m-form-element 外面,
            並把框搬到 .m-form-container。框搬家時,內距、高度那幾組 modifier
            (--px-XX / --py-XX / --h-XX)也要一起搬 ——
            它們定義在 .m-form-element 底下,而 container 是它的父層,
            變數傳不過去。 -->
          <span
            v-if="formatLength"
            class="m-form-length"
            :class="setClass.length"
            v-bind="config.attr.length"
          >
            {{ formatLength }}
          </span>
        </div>
      </div>
    </Field>
    <ErrorMessage
      v-slot="{ message }"
      as="span"
      :name="props.name"
      class="m-form-error"
      :class="setClass.error"
      v-bind="config.attr.error"
    >
      <CommonMErrorMessage :message="message" />
    </ErrorMessage>
  </div>
</template>
