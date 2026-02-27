import { mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./Input.DrK-MnGh.js";
import { u as useBuyBasicStore } from "./basic.BQ1dZmyM.js";
import { u as useStores } from "./useStores.2GhJj387.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/nuxt/node_modules/hookable/dist/index.mjs";
import "../../server.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/klona/dist/index.mjs";
import "#internal/nuxt/paths";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/defu/dist/defu.mjs";
import { storeToRefs } from "pinia";
import "./SvgIcon.CBDcrtuZ.js";
import "./mForm.css.yrdBraIC.js";
import "./_prototype.Mf8Dpr9m.js";
import "./_validation.uUSMHlAI.js";
import "@vee-validate/rules";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/h3/dist/index.mjs";
import "./project.D4zrwblI.js";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ofetch/dist/node.mjs";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "F:/Git/YungChing/Dev/HouseFun/Backstage/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "CaseMainSq",
  __ssrInlineRender: true,
  setup(__props) {
    const buyBasic = useBuyBasicStore();
    const { basic } = useStores();
    const { pingData, pingUnitLabel } = storeToRefs(buyBasic);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<ul${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap tm:gap-x-[8px] p:gap-x-[24px]" }, _attrs))}><li>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        name: "caseMainSq",
        modelValue: unref(pingData).caseMainSq,
        "onUpdate:modelValue": ($event) => unref(pingData).caseMainSq = $event,
        config: {
          inputMode: "numeric",
          inputChinese: false,
          checkNotIsZero: true
        },
        setClass: {
          main: "--height-40 --px-12 --py-8 p:w-[270px]",
          element: "grow",
          rearAssist: "text-[14px] text-[--gray-999]"
        },
        onBlur: ($event) => unref(basic).onPinSqMetersConvert("caseMainSq")
      }, {
        rearAssist: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(pingUnitLabel))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(pingUnitLabel)), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buy/_components/basic/Ping/CaseMainSq.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=CaseMainSq.C0eZcl9g.js.map
