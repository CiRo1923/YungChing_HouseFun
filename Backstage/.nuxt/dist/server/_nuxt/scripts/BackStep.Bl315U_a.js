import { ref, computed, mergeProps, unref, useSSRContext, withCtx, createVNode } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot, ssrRenderList, ssrRenderClass, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$3 } from "./mAnchor.CraGu5-t.js";
import { _ as _sfc_main$4 } from "./SvgIcon.CBDcrtuZ.js";
const _sfc_main$2 = {
  __name: "mAnchorTool",
  __ssrInlineRender: true,
  props: {
    anchor: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const device = ref("p");
    const isDeviceP = computed(() => device.value === "p");
    const anchor = computed(() => {
      return {
        text: "返回",
        to: null,
        href: null,
        icon: {
          position: "left",
          name: "chevron_left"
        },
        onClick: null,
        ...props.anchor
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "m-toolbar" }, _attrs))}><ul class="p:flex p:items-center p:gap-x-[16px]">`);
      if (unref(isDeviceP)) {
        _push(`<li class="tm:hidden p:shrink-0">`);
        _push(ssrRenderComponent(_sfc_main$3, {
          text: unref(anchor).text,
          to: unref(anchor).to,
          href: unref(anchor).href,
          config: {
            icon: unref(anchor).icon
          },
          setClass: {
            main: "--border-gray-e5 --bg-white --oval --height-30 --px-15",
            text: "text-[--gray-666]",
            icon: "text-[--gray-999] p:h-[16px] p:w-[16px]"
          },
          onClick: unref(anchor).onClick
        }, null, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<li class="flex h-[30px] flex-col justify-center rounded-full bg-[--white] px-[20px] p:grow">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</li></ul></div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mAnchorTool.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "Arrow",
  __ssrInlineRender: true,
  props: {
    options: {
      type: Array,
      default: () => []
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
        active: 0,
        icon: null,
        ...props.config
      };
    });
    const setClass = computed(() => {
      return {
        main: "",
        item: "",
        icon: "",
        ...props.setClass
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({
        class: ["m-step --arrow flex items-center", unref(setClass).main]
      }, _attrs))}><!--[-->`);
      ssrRenderList(props.options, (item, index) => {
        _push(`<li class="${ssrRenderClass([[
          {
            "--enabled": index < unref(config).active,
            "--active": index === unref(config).active
          },
          unref(setClass).item
        ], "m-step-item flex items-center"])}">`);
        if (index > unref(config).active) {
          _push(ssrRenderComponent(_sfc_main$4, {
            icon: "chevron_right",
            class: "m-step-icon text-[--gray-e5]"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (index <= unref(config).active) {
          _push(ssrRenderComponent(_sfc_main$4, {
            icon: unref(config).icon,
            class: ["m-step-icon", unref(setClass).icon]
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        ssrRenderSlot(_ctx.$slots, "default", {
          item,
          index
        }, () => {
          _push(`<em>${ssrInterpolate(item.label)}</em>`);
        }, _push, _parent);
        _push(`</li>`);
      });
      _push(`<!--]--></ul>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mStep/Arrow.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "BackStep",
  __ssrInlineRender: true,
  props: {
    anchor: {
      type: Object,
      default: null
    },
    stepOptions: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const props = __props;
    const config = computed(() => {
      return {
        active: 0,
        ...props.config
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$2, mergeProps({
        anchor: props.anchor
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_sfc_main$1, {
              options: props.stepOptions,
              config: {
                active: unref(config).active,
                icon: "icon_check_solid"
              },
              setClass: {
                item: "flex-1 gap-x-[3px]",
                icon: "text-[--orange-e646]"
              }
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_sfc_main$1, {
                options: props.stepOptions,
                config: {
                  active: unref(config).active,
                  icon: "icon_check_solid"
                },
                setClass: {
                  item: "flex-1 gap-x-[3px]",
                  icon: "text-[--orange-e646]"
                }
              }, null, 8, ["options", "config"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_container/BackStep.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=BackStep.Bl315U_a.js.map
