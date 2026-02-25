import { mergeProps, useSSRContext, shallowReadonly, withCtx, unref, createVNode, resolveDynamicComponent, openBlock, createBlock, Fragment, renderList } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderSlot, ssrRenderComponent, ssrRenderList, ssrRenderVNode } from "vue/server-renderer";
import { _ as _sfc_main$a } from "./Label.BJzWF104.js";
import _sfc_main$2 from "./CasePurpose.BA7miFL8.js";
import _sfc_main$3 from "./CaseTitle.DOqkCzLQ.js";
import _sfc_main$4 from "./Address.CxkCwD9L.js";
import _sfc_main$5 from "./CaseType.BipWqy_V.js";
import _sfc_main$6 from "./CaseUsage.Cj1r67ev.js";
import _sfc_main$7 from "./Zoing.rdAHJO9X.js";
import _sfc_main$8 from "./CaseLandNo.j6gGwBdP.js";
import _sfc_main$9 from "./Floor.7dC-4C7t.js";
import "./RadiosOval.TpLHyNVG.js";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.Kz_kpQ5n.js";
import "./_prototype.DwbhdnQa.js";
import "@vee-validate/rules";
import "./project.DqU6Ajm9.js";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/hookable/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "pinia";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "./Input.DngVdA-a.js";
import "./mAddress.C-x2H1ny.js";
import "./Select.BLbzLLvT.js";
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
  __name: "CardFilterInfo",
  __ssrInlineRender: true,
  setup(__props) {
    const items = shallowReadonly([
      {
        id: "casePurpose",
        label: "現況",
        class: "p:h-[35px]",
        component: _sfc_main$2
      },
      {
        id: "caseTitle",
        label: "物件標題",
        class: "p:h-[40px]",
        component: _sfc_main$3
      },
      {
        id: "address",
        label: "地址",
        class: "p:h-[40px]",
        component: _sfc_main$4
      },
      {
        id: "caseType",
        label: "型態",
        class: "p:h-[40px]",
        component: _sfc_main$5
      },
      {
        id: "caseUsage",
        label: "法定用途",
        class: "p:h-[40px]",
        component: _sfc_main$6
      },
      {
        id: "zoing",
        label: "土地分區",
        class: "p:h-[35px]",
        component: _sfc_main$7
      },
      {
        id: "caseLandNo",
        label: "地號",
        class: "p:h-[40px]",
        component: _sfc_main$8
      },
      {
        id: "floor",
        label: "出售樓層",
        class: "p:h-[35px]",
        component: _sfc_main$9
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "基本資料" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<ul class="tm:space-y-[40px] p:space-y-[24px]"${_scopeId}><!--[-->`);
            ssrRenderList(unref(items), (item, index) => {
              _push2(`<li class="tm:space-y-[12px] p:flex p:gap-x-[8px]"${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$a, {
                label: item.label,
                setClass: {
                  main: ["shrink-0 p:flex p:w-[100px] p:items-center", item.class]
                }
              }, null, _parent2, _scopeId));
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.component), null, null), _parent2, _scopeId);
              _push2(`</li>`);
            });
            _push2(`<!--]--></ul>`);
          } else {
            return [
              createVNode("ul", { class: "tm:space-y-[40px] p:space-y-[24px]" }, [
                (openBlock(true), createBlock(Fragment, null, renderList(unref(items), (item, index) => {
                  return openBlock(), createBlock("li", {
                    class: "tm:space-y-[12px] p:flex p:gap-x-[8px]",
                    key: `${item.id}_${index}`
                  }, [
                    createVNode(_sfc_main$a, {
                      label: item.label,
                      setClass: {
                        main: ["shrink-0 p:flex p:w-[100px] p:items-center", item.class]
                      }
                    }, null, 8, ["label", "setClass"]),
                    (openBlock(), createBlock(resolveDynamicComponent(item.component)))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/CardFilterInfo.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CardFilterInfo.CMebJ21f.js.map
