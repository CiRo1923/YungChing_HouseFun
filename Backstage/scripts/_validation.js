import { unicodLength } from '@js/_prototype.js'
import { defineRule } from 'vee-validate'
import { all as rules } from '@vee-validate/rules'

const replaceMessage = (elem, object) => {
  let message = object.errorMessage || object[0]

  if (object.value !== null && object.value !== undefined) {
    const regex = /{\s?.*\s?}/

    message = message ? message.replace(regex, object.value) : message
  } else {
    const attributes = document.querySelector(`[name="${elem.name}"]`).attributes

    for (let i = 0; i < attributes.length; i += 1) {
      const { nodeName, nodeValue } = attributes[i]
      const regex = new RegExp(`{\\s?${nodeName}\\s?}`)

      message = message ? message.replace(regex, nodeValue) : message
    }
  }

  return message
}

Object.keys(rules).forEach((rule) => {
  defineRule(rule, rules[rule])
})

// 必填
defineRule('required', (value, object, elem) => {
  const isArray = Array.isArray(object)
  const hasValue = value?.length > 0
  const valid = hasValue || (!isArray && !object.valid)

  return !valid ? replaceMessage(elem, object) : true
})

// 最大字元長度
defineRule('maxlength', (value, object, elem) => {
  const $elem = document.querySelector(`[name="${elem.name}"]`)
  const maxlength = object.value || Number($elem.getAttribute('maxlength'))

  return value && unicodLength(value) > maxlength ? replaceMessage(elem, object) : true
})

// 最小字元長度
defineRule('minlength', (value, object, elem) => {
  const $elem = document.querySelector(`[name="${elem.name}"]`)
  const minlength = object.value || Number($elem.getAttribute('minlength'))

  return value && unicodLength(value) < minlength ? replaceMessage(elem, object) : true
})

// 中文格式
defineRule('chinese', (value, message) => {
  return value && !/^[\u4e00-\u9fa5]+$/.test(value) ? message[0] : true
})

// 半形字元
defineRule('halfWidth', (value, object) => {
  const isObject = !!object.exception
  const exception = isObject ? value.replace(new RegExp(`\\${object.exception}`, 'g', '')) : value

  return value && /[^x00-xff]/g.test(exception) ? (isObject ? object.message : object[0]) : true
})

// 電話格式
defineRule('phone', (value, message) => {
  return value && (!/^09\d{8}$/.test(value) || !/^0\d{1,4}-?\d{5,8}(#\d+)?$/.test(value))
    ? message[0]
    : true
})

// 數字格式
defineRule('number', (value, message) => {
  return value && !/^\d+$/.test(value) ? message[0] : true
})

// email 格式
defineRule('email', (value, message) => {
  return value && !/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/.test(value)
    ? message[0]
    : true
})

// 自定義驗證
defineRule('custom', (value, object) => {
  const { valid, errorMessage } = object

  return value && typeof valid === 'boolean' ? valid : !valid.test(value) ? errorMessage : true
})
