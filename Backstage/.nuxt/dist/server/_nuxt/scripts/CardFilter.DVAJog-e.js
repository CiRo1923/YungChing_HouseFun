import { mergeProps, useSSRContext, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, Fragment, renderList, createCommentVNode } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderSlot, ssrRenderComponent, ssrRenderList, ssrRenderVNode } from "vue/server-renderer";
import { _ as _sfc_main$2 } from "./Label.BJzWF104.js";
const _sfc_main$1 = {
  __name: "Filter",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "m-card --filter --bg-white --rounded-15 tm:px-[16px] tm:py-[32px] p:flex p:gap-x-[40px] p:p-[40px]" }, _attrs))}><header class="m-card-header tm:pb-[16px] p:shrink-0 p:pr-[44px]"><h3 class="text-[--gray-333] tm:text-center tm:text-[20px] p:text-[24px]"><strong class="font-medium">${ssrInterpolate(props.title)}</strong></h3></header><div class="m-card-body tm:pt-[32px] p:grow">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/buy/mCard/Filter.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "CardFilter",
  __ssrInlineRender: true,
  props: {
    title: {
      type: String,
      default: null
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        title: props.title
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<ul class="tm:space-y-[40px] p:space-y-[24px]"${_scopeId}><!--[-->`);
            ssrRenderList(props.items, (item, index) => {
              _push2(`<li class="m:space-y-[12px] pt:flex pt:gap-x-[8px]"${_scopeId}>`);
              if (item.label) {
                _push2(ssrRenderComponent(_sfc_main$2, {
                  label: item.label,
                  config: {
                    isRequired: item.isRequired
                  },
                  setClass: {
                    main: ["pt:flex pt:w-[100px] pt:shrink-0 pt:items-center", item.class]
                  }
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="pt:grow"${_scopeId}>`);
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.component), null, null), _parent2, _scopeId);
              _push2(`</div></li>`);
            });
            _push2(`<!--]--></ul>`);
          } else {
            return [
              createVNode("ul", { class: "tm:space-y-[40px] p:space-y-[24px]" }, [
                (openBlock(true), createBlock(Fragment, null, renderList(props.items, (item, index) => {
                  return openBlock(), createBlock("li", {
                    class: "m:space-y-[12px] pt:flex pt:gap-x-[8px]",
                    key: `${item.id}_${index}`
                  }, [
                    item.label ? (openBlock(), createBlock(_sfc_main$2, {
                      key: 0,
                      label: item.label,
                      config: {
                        isRequired: item.isRequired
                      },
                      setClass: {
                        main: ["pt:flex pt:w-[100px] pt:shrink-0 pt:items-center", item.class]
                      }
                    }, null, 8, ["label", "config", "setClass"])) : createCommentVNode("", true),
                    createVNode("div", { class: "pt:grow" }, [
                      (openBlock(), createBlock(resolveDynamicComponent(item.component)))
                    ])
                  ]);
                }), 128))
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_containers/CardFilter.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilter.DVAJog-e.js.map
