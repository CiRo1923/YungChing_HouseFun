import { ref, computed, mergeProps, unref, isRef, withCtx, createVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseEqual, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./SvgIcon.CBDcrtuZ.js";
import { a as Field, E as ErrorMessage, _ as _sfc_main$2 } from "./mForm.css.yrdBraIC.js";
import "./_validation.uUSMHlAI.js";
const _sfc_main = {
  __name: "RadiosOval",
  __ssrInlineRender: true,
  props: {
    name: {
      type: String,
      default: ""
    },
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Number, Boolean, Array],
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
  emits: ["update:modelValue", "change"],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const selected = ref(null);
    const model = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emits("update:modelValue", value);
      }
    });
    const config = computed(() => {
      return {
        modelMode: "value",
        // isReadonly: false,
        // isDisabled: false,
        // isError: false,
        schema: {
          label: "label",
          value: "value"
        },
        ...props.config
      };
    });
    const setClass = computed(() => {
      return {
        ...{
          main: "",
          radios: "",
          container: "",
          element: "",
          type: "",
          error: ""
        },
        ...props.setClass
      };
    });
    const onSelected = () => {
      const { schema } = config.value;
      const isModelData = typeof model.value === "object";
      selected.value = model.value !== void 0 ? isModelData ? model.value[schema.value] : model.value : "";
    };
    onSelected();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["m-form --radios-oval overflow-hidden", unref(setClass).main]
      }, _attrs))}><ul class="${ssrRenderClass([unref(setClass).radios, "m-form-radios inline-flex overflow-hidden tm:flex-wrap tm:gap-x-[9px] tm:gap-y-[12px] p:rounded-[5px] p:bg-[--gray-f2]"])}"><!--[-->`);
      ssrRenderList(props.options, (item, index) => {
        _push(`<li class="${ssrRenderClass([unref(setClass).container, "m-form-container overflow-hidden tm:h-[50px] tm:rounded-[5px] tm:bg-[--gray-f2] p:h-[35px]"])}"><label class="${ssrRenderClass([[
          {
            "--checked": item[unref(config).schema.value] === unref(selected)
          },
          unref(setClass).element
        ], "m-form-element relative flex h-full w-full cursor-pointer items-center justify-center text-[--gray-666] transition-colors duration-300 tm:gap-x-[3px] tm:px-[10px] p:gap-x-[5px] p:px-[12px]"])}"><input type="radio"${ssrRenderAttr("name", props.name)}${ssrIncludeBooleanAttr(ssrLooseEqual(unref(selected), item[unref(config).schema.value])) ? " checked" : ""}${ssrRenderAttr("value", item[unref(config).schema.value])} class="${ssrRenderClass([unref(setClass).type, "m-form-type sr-only"])}">`);
        if (item[unref(config).schema.value] === unref(selected)) {
          _push(ssrRenderComponent(_sfc_main$1, {
            icon: "icon_check_solid",
            class: "m-form-icon h-[16px] w-[16px] text-[--orange-e646]"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<em class="m-form-label text-[16px]">${ssrInterpolate(item[unref(config).schema.label])}</em></label></li>`);
      });
      _push(`<!--]--></ul>`);
      _push(ssrRenderComponent(unref(Field), {
        name: `${props.name}_radios`,
        modelValue: unref(selected),
        "onUpdate:modelValue": ($event) => isRef(selected) ? selected.value = $event : null,
        rules: props.rules
      }, {
        default: withCtx(({ field }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<input${ssrRenderAttrs(mergeProps({
              type: "hidden",
              id: `${props.name}_radios`
            }, field))}${_scopeId}>`);
          } else {
            return [
              createVNode("input", mergeProps({
                type: "hidden",
                id: `${props.name}_radios`
              }, field), null, 16, ["id"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(ErrorMessage), {
        as: "span",
        name: `${props.name}_radios`,
        class: ["m-form-error", unref(setClass).error]
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mForm/RadiosOval.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=RadiosOval.C_eW4Qov.js.map
