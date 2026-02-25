import { ref, computed, watch, mergeProps, unref, withCtx, createVNode, openBlock, createBlock, renderSlot, createCommentVNode, withKeys, toDisplayString, nextTick, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderSlot, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./SvgIcon.CBDcrtuZ.js";
import { a as Field, E as ErrorMessage, _ as _sfc_main$2 } from "./mForm.css.Kz_kpQ5n.js";
import { d as deepMerge, n as numberComma } from "./_prototype.DwbhdnQa.js";
const _sfc_main = {
  __name: "Input",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: "text"
    },
    modelValue: {
      type: [String, Number],
      default: null
    },
    value: {
      type: [String, Number],
      default: null
    },
    rules: {
      type: Object,
      default: null
    },
    config: {
      type: Object,
      default: () => {
      }
    },
    setClass: {
      type: Object,
      default: () => {
      }
    }
  },
  emits: [
    "update:modelValue",
    "focusin",
    // 'focusout',
    "blur",
    "input",
    "keydown.enter"
  ],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const model = ref(null);
    const isFocus = ref(false);
    const config = computed(() => {
      return deepMerge(
        {
          placeholder: "",
          length: null,
          minlength: null,
          maxlength: null,
          formatLength: null,
          isReadonly: false,
          isDisabled: false,
          isError: false,
          inputMode: null,
          isExistClose: true,
          // 輸入後開啟 X 清除
          inputChinese: true,
          // 開啟關閉輸入中文
          comma: false,
          // 啟用千分位功能
          checkNotIsZero: false,
          // 輸入欄位致不能為 0
          integer: false
          // 整數功能 (不可使用小數點)
        },
        props.config
      );
    });
    const isNumeric = computed(() => config.value.inputMode === "numeric");
    const formatLength = computed(() => {
      const { formatLength: formatLength2, maxlength } = config.value;
      return formatLength2 && maxlength ? formatLength2.replace(/\{\s*(length|maxlength)\s*\}/g, (_, key) => {
        return key === "length" ? model.value ? String(model.value.length) : 0 : String(maxlength);
      }) : null;
    });
    const setClass = computed(() => {
      return {
        ...{
          main: "",
          container: "",
          element: "",
          type: "",
          formatLength: "",
          frontAssist: "",
          rearAssist: "",
          suffix: "",
          error: ""
        },
        ...props.setClass
      };
    });
    const onBind = (field) => {
      const { inputMode } = config.value;
      const value = !props.modelValue && props.value ? {
        value: props.value
      } : {};
      const inputmode = isNumeric.value ? {
        inputmode: inputMode
      } : {};
      return {
        ...field,
        ...value,
        ...inputmode
      };
    };
    const onInput = async (e) => {
      const value = e.target.value;
      const { inputMode, checkNotIsZero, integer, inputChinese } = config.value;
      const regex = {
        chinese: /[\u4e00-\u9fa5０-９Ａ-Ｚａ-ｚ～！＠＃＄％︿＆＊（）＿｜｛｝［］＜＞？／＊＼＋－]/g,
        number: integer ? /[^0-9]/g : /[^0-9.]/g
      };
      const isRemoveChinese = (/numeric/.test(inputMode) || !inputChinese) && regex.chinese.test(value);
      await nextTick();
      if (isNumeric.value) {
        const number = regex.number.test(value) ? value.replace(regex.number, "") : value;
        model.value = checkNotIsZero && integer && /^0/.test(number) || checkNotIsZero && /^0\d/.test(number) ? number.replace(/^0+/, "") : number;
      } else if (isRemoveChinese) {
        model.value = value.replace(regex.chinese, "");
      }
      emits("input", e);
    };
    const onEnter = (e) => {
      e.preventDefault();
      emits("keydown.enter");
    };
    const onEvent = (e, errorMessage) => {
      const { comma, checkNotIsZero } = config.value;
      const { type } = e;
      const isError = !!errorMessage;
      const isFocusIn = type === "focusin";
      const isBlur = type === "blur";
      const isComma = comma && (model.value !== "" || model.value != null);
      if (isFocusIn || isBlur) {
        isFocus.value = !isFocus.value;
      }
      if (isFocusIn && isComma) {
        model.value = numberComma.remove(model.value, false);
      }
      if (isBlur) {
        if (isNumeric.value) {
          model.value = checkNotIsZero && /^0\.$/.test(model.value) ? model.value.replace(/^0\.$/, "") : model.value;
        }
        const value = isComma ? numberComma.remove(model.value, false) : model.value;
        emits("update:modelValue", value);
        model.value = isComma ? numberComma.add(model.value, false) : model.value;
      }
      emits(type, e, isError);
    };
    const onWatchModel = (value) => {
      const { comma } = config.value;
      const isComma = comma && value !== "" && value != null;
      model.value = isComma ? numberComma.add(value, false) : value;
    };
    const onClear = () => {
      model.value = null;
    };
    watch(
      () => props.modelValue,
      (value) => {
        onWatchModel(value);
      },
      {
        immediate: true
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-form overflow-hidden", setClass.value.main]
      }, _attrs))}>`);
      _push(ssrRenderComponent(unref(Field), {
        name: props.name,
        type: props.type,
        modelValue: model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        rules: props.rules
      }, {
        default: withCtx(({ field, errorMessage }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="${ssrRenderClass([setClass.value.container, "m-form-container"])}"${_scopeId}><div class="${ssrRenderClass([[
              setClass.value.element,
              { "--focus": isFocus.value },
              { "--readonly": config.value.isReadonly },
              { "--disabled": config.value.isDisabled },
              { "--error": errorMessage || config.value.isError }
            ], "m-form-element"])}"${_scopeId}>`);
            if (_ctx.$slots.frontAssist) {
              _push2(`<div class="${ssrRenderClass([setClass.value.frontAssist, "m-form-assist shrink-0"])}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "frontAssist", {}, null, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<input${ssrRenderAttrs(mergeProps({
              id: props.name,
              type: props.type,
              class: ["m-form-type min-w-0 grow", setClass.value.type]
            }, onBind(field), {
              inputMode: config.value.inputMode,
              minlength: config.value.minlength || config.value.length,
              maxlength: config.value.maxlength || config.value.length,
              placeholder: config.value.placeholder,
              readonly: config.value.isReadonly,
              disabled: config.value.isDisabled,
              autocomplete: "off"
            }))}${_scopeId}>`);
            if (config.value.isExistClose && !config.value.isDisabled) {
              _push2(`<button type="button" class="${ssrRenderClass([{
                "--show": model.value
              }, "m-form-clear-button"])}"${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$1, {
                icon: "icon_xmark",
                class: "m-form-clear-icon"
              }, null, _parent2, _scopeId));
              _push2(`</button>`);
            } else {
              _push2(`<!---->`);
            }
            if (formatLength.value) {
              _push2(`<span class="${ssrRenderClass([setClass.value.length, "m-form-length shrink-0"])}"${_scopeId}>${ssrInterpolate(formatLength.value)}</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (_ctx.$slots.rearAssist) {
              _push2(`<div class="${ssrRenderClass([setClass.value.rearAssist, "m-form-assist shrink-0"])}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "rearAssist", {}, null, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (_ctx.$slots.suffix) {
              _push2(`<small class="${ssrRenderClass([setClass.value.suffix, "m-form-suffix shrink-0"])}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "suffix", {
                maxlength: config.value.length || config.value.maxlength,
                length: model.value ? model.value.length : 0
              }, null, _push2, _parent2, _scopeId);
              _push2(`</small>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", {
                class: ["m-form-container", setClass.value.container]
              }, [
                createVNode("div", {
                  class: ["m-form-element", [
                    setClass.value.element,
                    { "--focus": isFocus.value },
                    { "--readonly": config.value.isReadonly },
                    { "--disabled": config.value.isDisabled },
                    { "--error": errorMessage || config.value.isError }
                  ]]
                }, [
                  _ctx.$slots.frontAssist ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: ["m-form-assist shrink-0", setClass.value.frontAssist]
                  }, [
                    renderSlot(_ctx.$slots, "frontAssist")
                  ], 2)) : createCommentVNode("", true),
                  createVNode("input", mergeProps({
                    id: props.name,
                    type: props.type,
                    class: ["m-form-type min-w-0 grow", setClass.value.type]
                  }, onBind(field), {
                    inputMode: config.value.inputMode,
                    minlength: config.value.minlength || config.value.length,
                    maxlength: config.value.maxlength || config.value.length,
                    placeholder: config.value.placeholder,
                    readonly: config.value.isReadonly,
                    disabled: config.value.isDisabled,
                    autocomplete: "off",
                    onFocusin: ($event) => onEvent($event),
                    onBlur: ($event) => onEvent($event, errorMessage),
                    onInput: ($event) => onInput($event),
                    onKeydown: withKeys(($event) => onEnter($event), ["enter"])
                  }), null, 16, ["id", "type", "inputMode", "minlength", "maxlength", "placeholder", "readonly", "disabled", "onFocusin", "onBlur", "onInput", "onKeydown"]),
                  config.value.isExistClose && !config.value.isDisabled ? (openBlock(), createBlock("button", {
                    key: 1,
                    type: "button",
                    class: ["m-form-clear-button", {
                      "--show": model.value
                    }],
                    onClick: onClear
                  }, [
                    createVNode(_sfc_main$1, {
                      icon: "icon_xmark",
                      class: "m-form-clear-icon"
                    })
                  ], 2)) : createCommentVNode("", true),
                  formatLength.value ? (openBlock(), createBlock("span", {
                    key: 2,
                    class: ["m-form-length shrink-0", setClass.value.length]
                  }, toDisplayString(formatLength.value), 3)) : createCommentVNode("", true),
                  _ctx.$slots.rearAssist ? (openBlock(), createBlock("div", {
                    key: 3,
                    class: ["m-form-assist shrink-0", setClass.value.rearAssist]
                  }, [
                    renderSlot(_ctx.$slots, "rearAssist")
                  ], 2)) : createCommentVNode("", true)
                ], 2),
                _ctx.$slots.suffix ? (openBlock(), createBlock("small", {
                  key: 0,
                  class: ["m-form-suffix shrink-0", setClass.value.suffix]
                }, [
                  renderSlot(_ctx.$slots, "suffix", {
                    maxlength: config.value.length || config.value.maxlength,
                    length: model.value ? model.value.length : 0
                  })
                ], 2)) : createCommentVNode("", true)
              ], 2)
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(ssrRenderComponent(unref(ErrorMessage), {
        as: "span",
        name: props.name,
        class: ["m-form-error", setClass.value.error]
      }, {
        default: withCtx(({ message }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$2, { message }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$2, { message }, null, 8, ["message"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mForm/Input.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=Input.DngVdA-a.js.map
