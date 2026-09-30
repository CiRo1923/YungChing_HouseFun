import { onUnicodLength } from '@js/_prototype.js'
import { defineRule } from 'vee-validate'
import { all as rules } from '@vee-validate/rules'

const onReplaceMessage = (elem, object) => {
  let message = object.errorMessage || object[0]

  if (object.value == null) {
    const attributes = document.querySelector(`[name="${elem.name}"]`).attributes

    for (let i = 0; i < attributes.length; i += 1) {
      const { nodeName, nodeValue } = attributes[i]
      const regex = new RegExp(String.raw`{\s?${nodeName}\s?}`)

      message = message ? message.replace(regex, nodeValue) : message
    }
  } else {
    const regex = /{\s?.*\s?}/

    message = message ? message.replace(regex, object.value) : message
  }

  return message
}

Object.keys(rules).forEach((rule) => {
  defineRule(rule, rules[rule])
})

// 必填
/* 什麼算「沒有值」—— **每一種型別各回答一次**。

  先前是拿 length 當判準,而那個屬性只有字串與陣列有:數字要先轉成字串
  才繞得過去,布林沒有任何路徑走得到。所以又補了一個條件去救布林,
  而那個補救把正確的判斷整個蓋掉了 —— 參數寫成物件的時候一律通過,
  欄位沒填也送得出去,而且不報錯。

  布林要由使用端給資訊:同意條款的 false 是「沒勾」,
  而「要不要收電子報」的 false 是一個答案 —— 規則自己分不出這兩者,
  所以參數帶 type: 'boolean' 的那一種才把 false 當成沒填。

  數字的 0 是一個答案,不是沒填。 */
export const isEmptyValue = (value, params) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'boolean') return params.type === 'boolean' ? !value : false

  return false
}

defineRule('required', (value, object, elem) => {
  const el = document.querySelector(`[name="${elem.name}"]`)

  if (el?.disabled) return true

  /* 參數有兩種形狀:只給訊息時 vee-validate 會把那個字串包成陣列,
     帶設定的那一種是物件 —— 型別的資訊只有後者有。 */
  const params = Array.isArray(object) ? {} : object

  return isEmptyValue(value, params) ? onReplaceMessage(elem, object) : true
})

// 最大字元長度
defineRule('maxlength', (value, object, elem) => {
  const $elem = document.querySelector(`[name="${elem.name}"]`)
  const maxlength = object.value || Number($elem.getAttribute('maxlength'))

  return value && onUnicodLength(value) > maxlength ? onReplaceMessage(elem, object) : true
})

// 最小字元長度
defineRule('minlength', (value, object, elem) => {
  const $elem = document.querySelector(`[name="${elem.name}"]`)
  const minlength = object.value || Number($elem.getAttribute('minlength'))

  return value && onUnicodLength(value) < minlength ? onReplaceMessage(elem, object) : true
})

// 中文格式
defineRule('chinese', (value, message) => {
  return value && !/^[\u4e00-\u9fa5]+$/.test(value) ? message[0] : true
})

/* 半形字元。

  這一條問的是「有沒有全形字」,不是「是不是英文字母」——
  abc123、a-b_c、ABC!@# 全部放行。只能填英文字母的欄位用 english。

  exception 是「這幾個字元不算」:先把它們拿掉再檢查。
  **替換字串要傳給 replace,不是傳給 RegExp** ——
  RegExp 只吃比對式與旗標兩個參數,第三個會被無聲忽略;
  而 replace 少了第二個參數時,JS 把 undefined 當成字串 "undefined" 填進去,
  `a-b` 會變成 `aundefinedb`。那個結果多半仍然通過(它不含全形字),
  所以不會有人發現 —— 要到例外字元本身是全形的時候才看得出行為不同。 */
defineRule('halfWidth', (value, object) => {
  const isObject = !!object.exception
  const exception = isObject
    ? value.replace(new RegExp(`\\${object.exception}`, 'g'), '')
    : value

  const message = isObject ? object.message : object[0]

  return value && /[\u0100-\uffff]/g.test(exception) ? message : true
})

// 手機格式
defineRule('phone', (value, message) => {
  return value && !/^09\d{8}$/.test(value) ? message[0] : true
})

// 電話格式
defineRule('tel', (value, message) => {
  return value && !/^0\d{1,4}-?\d{5,8}(#\d+)?$/.test(value) ? message[0] : true
})

// 手機&手機格式
defineRule('bothTelPhone', (value, message) => {
  return value && (!/^09\d{8}$/.test(value) || !/^0\d{1,4}-?\d{5,8}(#\d+)?$/.test(value))
    ? message[0]
    : true
})

// 數字格式
defineRule('number', (value, message) => {
  return value && !/^\d+$/.test(value) ? message[0] : true
})

/* 只能填英文字母。

  與 chinese、number 同一組語彙:那兩條各自回答「只收中文」「只收數字」,
  這一條回答「只收英文字母」。**數字不放行** —— 要英數混合的欄位
  兩條一起掛,或是回報一條新的;放行數字的話,這一條與 number 的界線就糊了。

  halfWidth 代替不了它:那一條問的是「有沒有全形字」,
  所以 abc123、a-b_c、ABC!@# 全部放行。

  會拿去當網址一段的值(代號、識別字)要用這一條 ——
  中文與全形字在網址裡要編碼,對不起來。 */
defineRule('english', (value, message) => {
  return value && !/^[a-zA-Z]+$/.test(value) ? message[0] : true
})

// 統一發票號碼:兩碼英文字母加八碼數字
defineRule('invoice', (value, message) => {
  return value && !/^[A-Za-z]{2}\d{8}$/.test(value) ? message[0] : true
})

/* 手機條碼載具:斜線開頭,後面七碼。

  那七碼只能是大寫英文、數字,以及 + . - 這三個符號。

  **減號要寫在字元類的最後一個位置。** 寫在中間的話它是「範圍」的意思
  (`+-.` 指的是 + 到 . 之間的所有字元,那一段還包含逗號),
  於是帶逗號的號碼也會通過 —— 而那一種要送到後端才會被退回來。 */
defineRule('barcode', (value, message) => {
  return value && !/^\/[A-Z0-9+.-]{7}$/.test(value) ? message[0] : true
})

/* 統一編號:八碼數字,而且要通過檢查碼。

  每一碼各乘自己的權重,乘出來如果是兩位數就把十位與個位相加(18 算成 1 + 8),
  全部加起來被 5 整除才算通過。

  **第七碼是 7 的那一種要多認一種算法。** 那一碼的權重是 4,乘出來是 28,
  而這個檢查碼有兩種並行的拆法,兩種都有正在使用的公司統編 ——
  所以總和加一之後被 5 整除也算通過。只認一種的話,真的存在的公司會被擋下來。

  全 0 與全 1 算得過檢查碼,但沒有公司是這兩個號碼 ——
  不排除的話,表單填八個 0 就送得出去。 */
defineRule('tax', (value, message) => {
  const onTaxValid = () => {
    const excluded = ['00000000', '11111111']

    if (!/^\d{8}$/.test(value) || excluded.includes(value)) return false

    const weights = [1, 2, 1, 2, 1, 2, 4, 1]

    // 兩位數要拆開再相加 —— 18 算成 1 + 8
    const onDigitSum = (product) => {
      const ones = product % 10

      return ones + (product - ones) / 10
    }

    let sum = 0

    for (let i = 0; i < weights.length; i += 1) {
      sum += onDigitSum(value[i] * weights[i])
    }

    return sum % 5 === 0 || (value[6] === '7' && (sum + 1) % 5 === 0)
  }

  return value && !onTaxValid() ? message[0] : true
})

// 影音網址格式（host 由 API 提供，未給時只驗協定）
defineRule('videoUrl', (value, object, elem) => {
  if (!value) return true

  try {
    const { protocol, hostname } = new URL(value)

    if (protocol !== 'https:') return onReplaceMessage(elem, object)

    // 精確比對，不可用 endsWith，否則 youtube.com.evil.com 會通過
    return !object.host?.length || object.host.includes(hostname)
      ? true
      : onReplaceMessage(elem, object)
  } catch {
    return onReplaceMessage(elem, object)
  }
})

// email 格式
defineRule('email', (value, message) => {
  return value && !/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\.[A-Za-z]+$/.test(value)
    ? message[0]
    : true
})

// 自定義驗證
defineRule('custom', (value, object, elem) => {
  const el = document.querySelector(`[name="${elem.name}"]`)

  if (el.disabled) return true

  const isArray = Array.isArray(object)
  const result =
    value != null && (typeof value === 'number' || typeof value === 'boolean')
      ? String(value)
      : value
  const hasValue = !!result?.length > 0
  const valid = hasValue ? !isArray && object.valid : true

  return valid ? true : onReplaceMessage(elem, object)
})
