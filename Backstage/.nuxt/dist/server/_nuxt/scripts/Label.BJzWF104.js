import { computed, createVNode, resolveDynamicComponent, unref, mergeProps, withCtx, renderSlot, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderVNode, ssrRenderSlot, ssrInterpolate } from "vue/server-renderer";
const _sfc_main = {
  __name: "Label",
  __ssrInlineRender: true,
  props: {
    label: {
      type: String,
      default: ""
    },
    config: {
      type: Object,
      default: () => ({})
    },
    setClass: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const props = __props;
    const config = computed(() => {
      return {
        as: "span",
        for: null,
        isRequired: true,
        ...props.config
      };
    });
    const dataRequired = computed(() => {
      const { isRequired } = config.value;
      return isRequired ? {
        "data-required": typeof isRequired === "boolean" ? "*" : isRequired
      } : {};
    });
    const setClass = computed(() => ({
      main: "",
      title: "",
      ...props.setClass
    }));
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(config).as), mergeProps({
        class: ["m-label text-[16px]", unref(setClass).main],
        for: unref(config).for
      }, unref(dataRequired), _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "default", {}, () => {
              _push2(`${ssrInterpolate(props.label)}`);
            }, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "default", {}, () => [
                createTextVNode(toDisplayString(props.label), 1)
              ])
            ];
          }
        }),
        _: 3
      }), _parent);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mForm/Label.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=Label.BJzWF104.js.map
