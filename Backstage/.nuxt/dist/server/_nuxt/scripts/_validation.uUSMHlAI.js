import { u as unicodLength } from "./_prototype.Mf8Dpr9m.js";
import { d as defineRule } from "./mForm.css.yrdBraIC.js";
import { all } from "@vee-validate/rules";
const replaceMessage = (elem, object) => {
  let message = object.errorMessage || object[0];
  if (object.value !== null && object.value !== void 0) {
    const regex = /{\s?.*\s?}/;
    message = message ? message.replace(regex, object.value) : message;
  } else {
    const attributes = (void 0).querySelector(`[name="${elem.name}"]`).attributes;
    for (let i = 0; i < attributes.length; i += 1) {
      const { nodeName, nodeValue } = attributes[i];
      const regex = new RegExp(`{\\s?${nodeName}\\s?}`);
      message = message ? message.replace(regex, nodeValue) : message;
    }
  }
  return message;
};
Object.keys(all).forEach((rule) => {
  defineRule(rule, all[rule]);
});
defineRule("required", (value, object, elem) => {
  const el = (void 0).querySelector(`[name="${elem.name}"]`);
  if (el.disabled) return true;
  const isArray = Array.isArray(object);
  const hasValue = value?.length > 0;
  const valid = hasValue || !isArray && !object.valid;
  return !valid ? replaceMessage(elem, object) : true;
});
defineRule("maxlength", (value, object, elem) => {
  const $elem = (void 0).querySelector(`[name="${elem.name}"]`);
  const maxlength = object.value || Number($elem.getAttribute("maxlength"));
  return value && unicodLength(value) > maxlength ? replaceMessage(elem, object) : true;
});
defineRule("minlength", (value, object, elem) => {
  const $elem = (void 0).querySelector(`[name="${elem.name}"]`);
  const minlength = object.value || Number($elem.getAttribute("minlength"));
  return value && unicodLength(value) < minlength ? replaceMessage(elem, object) : true;
});
defineRule("chinese", (value, message) => {
  return value && !/^[\u4e00-\u9fa5]+$/.test(value) ? message[0] : true;
});
defineRule("halfWidth", (value, object) => {
  const isObject = !!object.exception;
  const exception = isObject ? value.replace(new RegExp(`\\${object.exception}`, "g", "")) : value;
  return value && /[^x00-xff]/g.test(exception) ? isObject ? object.message : object[0] : true;
});
defineRule("phone", (value, message) => {
  return value && (!/^09\d{8}$/.test(value) || !/^0\d{1,4}-?\d{5,8}(#\d+)?$/.test(value)) ? message[0] : true;
});
defineRule("number", (value, message) => {
  return value && !/^\d+$/.test(value) ? message[0] : true;
});
defineRule("email", (value, message) => {
  return value && !/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/.test(value) ? message[0] : true;
});
defineRule("custom", (value, object, elem) => {
  const el = (void 0).querySelector(`[name="${elem.name}"]`);
  if (el.disabled) return true;
  const isArray = Array.isArray(object);
  const hasValue = value?.length > 0;
  const valid = hasValue && !isArray && object.valid;
  return !valid ? replaceMessage(elem, object) : true;
});
//# sourceMappingURL=_validation.uUSMHlAI.js.map
