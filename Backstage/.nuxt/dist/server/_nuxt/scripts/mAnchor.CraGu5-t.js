import { computed, createVNode, resolveDynamicComponent, unref, mergeProps, withCtx, renderSlot, openBlock, createBlock, createCommentVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderVNode, ssrRenderSlot, ssrRenderComponent, ssrRenderClass, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./SvgIcon.CBDcrtuZ.js";
const _sfc_main = {
  __name: "mAnchor",
  __ssrInlineRender: true,
  props: {
    text: {
      type: String,
      default: ""
    },
    to: {
      type: Object,
      default: null
    },
    href: {
      type: String,
      default: null
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
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const emits = __emit;
    const props = __props;
    const config = computed(() => {
      return {
        as: null,
        icon: null,
        target: null,
        isDisabled: false,
        ...props.config
      };
    });
    const as = computed(() => {
      const { as: as2 } = config.value;
      if (as2 === "router") return "router-link";
      if (/^(button|submit)$/.test(as2)) return "button";
      if (props.to) return "router-link";
      if (props.href) return "a";
      return "button";
    });
    const bind = computed(() => {
      return as.value === "router-link" ? {
        to: props.to,
        ...config.value.target ? {
          target: config.value.target,
          rel: "noopener"
        } : {}
      } : as.value === "a" ? {
        href: props.href,
        target: "_blank",
        rel: "noopener"
      } : as.value !== "div" ? {
        type: as.value
      } : null;
    });
    const icon = computed(() => {
      const { icon: icon2 } = config.value;
      const isString = icon2 ? typeof icon2 === "string" : true;
      return {
        position: isString ? "right" : icon2.position,
        name: isString ? icon2 : icon2.name
      };
    });
    const setClass = computed(() => {
      return {
        ...{
          main: "",
          text: "",
          icon: ""
        },
        ...props.setClass
      };
    });
    const onClick = (e) => {
      const { isDisabled } = config.value;
      if (isDisabled) {
        e.preventDefault();
      } else {
        emits("click", e);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(as)), mergeProps({
        class: ["m-anchor relative inline-flex items-center justify-center gap-x-[5px] tracking-[0.06em] transition-colors duration-300", unref(setClass).main]
      }, unref(bind), {
        disabled: unref(config).isDisabled,
        onClick
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "default", {}, () => {
              if (unref(icon).position === "left" && unref(icon).name) {
                _push2(ssrRenderComponent(_sfc_main$1, {
                  icon: unref(icon).name,
                  class: unref(setClass).icon
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`<b class="${ssrRenderClass([unref(setClass).text, "m-anchor-text"])}"${_scopeId}>${ssrInterpolate(props.text)}</b>`);
              if (unref(icon).position === "right" && unref(icon).name) {
                _push2(ssrRenderComponent(_sfc_main$1, {
                  icon: unref(icon).name,
                  class: unref(setClass).icon
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
            }, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "default", {}, () => [
                unref(icon).position === "left" && unref(icon).name ? (openBlock(), createBlock(_sfc_main$1, {
                  key: 0,
                  icon: unref(icon).name,
                  class: unref(setClass).icon
                }, null, 8, ["icon", "class"])) : createCommentVNode("", true),
                createVNode("b", {
                  class: ["m-anchor-text", unref(setClass).text]
                }, toDisplayString(props.text), 3),
                unref(icon).position === "right" && unref(icon).name ? (openBlock(), createBlock(_sfc_main$1, {
                  key: 1,
                  icon: unref(icon).name,
                  class: unref(setClass).icon
                }, null, 8, ["icon", "class"])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mAnchor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
//# sourceMappingURL=mAnchor.CraGu5-t.js.map
