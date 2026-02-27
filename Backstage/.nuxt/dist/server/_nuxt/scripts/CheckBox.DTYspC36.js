import { computed, mergeProps, unref, withCtx, createVNode, withDirectives, vModelCheckbox, renderSlot, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrLooseContain, ssrGetDynamicModelProps, ssrRenderSlot, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./SvgIcon.CBDcrtuZ.js";
import { a as Field, E as ErrorMessage, _ as _sfc_main$2 } from "./mForm.css.yrdBraIC.js";
import { d as deepMerge } from "./_prototype.Mf8Dpr9m.js";
const _sfc_main = {
  __name: "CheckBox",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: null
    },
    modelValue: {
      type: [Boolean, String, Array],
      default: false
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
  emits: ["update:modelValue", "change"],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const model = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emits("update:modelValue", value);
      }
    });
    const config = computed(() => {
      return deepMerge(
        {
          label: null,
          value: null,
          align: "top",
          isDisabled: false,
          schema: {
            key: "key",
            value: "value"
          }
        },
        props.config
      );
    });
    const bind = computed(() => {
      const { value } = config.value;
      const isTrueFalseValue = !Array.isArray(props.modelValue) && typeof value === "object";
      return isTrueFalseValue ? {
        "true-value": value.true,
        "false-value": value.false
      } : {
        value
      };
    });
    const setClass = computed(() => {
      return {
        ...{
          main: "",
          elem: "",
          content: "",
          label: "",
          error: ""
        },
        ...props.setClass
      };
    });
    const onChange = () => {
      emits("change");
    };
    return (_ctx, _push, _parent, _attrs) => {
      let _temp0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-form overflow-hidden", setClass.value.main]
      }, _attrs))}>`);
      _push(ssrRenderComponent(unref(Field), {
        name: props.name,
        type: "checkbox",
        modelValue: model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        rules: config.value.isDisabled ? "" : props.rules
      }, {
        default: withCtx(({ field, errorMessage }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="${ssrRenderClass([setClass.value.container, "m-form-container"])}"${_scopeId}><label class="${ssrRenderClass([[
              config.value.align === "top" ? "items-baseline" : "items-center",
              config.value.isDisabled ? "cursor-not-allowed" : "cursor-pointer",
              setClass.value.element
            ], "m-form-element --checkbox relative inline-flex gap-x-[8px] text-[--gray-999]"])}"${_scopeId}><input${ssrRenderAttrs((_temp0 = mergeProps({
              name: props.name,
              type: "checkbox",
              checked: Array.isArray(model.value) ? ssrLooseContain(model.value, null) : model.value
            }, bind.value, {
              class: ["m-form-type jFormValid sr-only", {
                "--error": errorMessage
              }],
              disabled: config.value.isDisabled
            }), mergeProps(_temp0, ssrGetDynamicModelProps(_temp0, model.value))))}${_scopeId}>`);
            _push2(ssrRenderComponent(_sfc_main$1, {
              icon: "icon_check_solid",
              class: ["m-form-icon relative mt-[3px] h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] p-[1px] text-[--orange-e646] transition-colors duration-300", setClass.value.icon]
            }, null, _parent2, _scopeId));
            ssrRenderSlot(_ctx.$slots, "default", {}, () => {
              _push2(`<em class="${ssrRenderClass(setClass.value.label)}"${_scopeId}>${ssrInterpolate(config.value.label)}</em>`);
            }, _push2, _parent2, _scopeId);
            _push2(`</label></div>`);
          } else {
            return [
              createVNode("div", {
                class: ["m-form-container", setClass.value.container]
              }, [
                createVNode("label", {
                  class: ["m-form-element --checkbox relative inline-flex gap-x-[8px] text-[--gray-999]", [
                    config.value.align === "top" ? "items-baseline" : "items-center",
                    config.value.isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                    setClass.value.element
                  ]]
                }, [
                  withDirectives(createVNode("input", mergeProps({
                    name: props.name,
                    type: "checkbox",
                    "onUpdate:modelValue": ($event) => model.value = $event
                  }, bind.value, {
                    class: ["m-form-type jFormValid sr-only", {
                      "--error": errorMessage
                    }],
                    disabled: config.value.isDisabled,
                    onChange
                  }), null, 16, ["name", "onUpdate:modelValue", "disabled"]), [
                    [vModelCheckbox, model.value]
                  ]),
                  createVNode(_sfc_main$1, {
                    icon: "icon_check_solid",
                    class: ["m-form-icon relative mt-[3px] h-[18px] w-[18px] shrink-0 self-start rounded-[2px] border-[1px] p-[1px] text-[--orange-e646] transition-colors duration-300", setClass.value.icon]
                  }, null, 8, ["class"]),
                  renderSlot(_ctx.$slots, "default", {}, () => [
                    createVNode("em", {
                      class: setClass.value.label
                    }, toDisplayString(config.value.label), 3)
                  ])
                ], 2)
              ], 2)
            ];
          }
        }),
        _: 3
      }, _parent));
      _push(ssrRenderComponent(unref(ErrorMessage), {
        as: "span",
        name: props.name,
        class: ["m-form-error block", setClass.value.error]
      }, {
        default: withCtx(({ message }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$2, {
              class: "text-[12px]",
              message
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$2, {
                class: "text-[12px]",
                message
              }, null, 8, ["message"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mForm/CheckBox.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=CheckBox.DTYspC36.js.map
